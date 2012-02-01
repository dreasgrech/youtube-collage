Array.prototype.shiftRange = function (n) {
    var out = [], i = 0;

    for (; i < n; ++i) {
        out.push(this.shift());
    }

    return out;
};

Array.prototype.forEach = function (callback) {
	var i = 0, j = this.length, stop;
	for (; i < j; ++i) {
		if (stop = callback(this[i], i)) {
		       return stop;
		}
	}
};

window.fbAsyncInit = function () {
    var APP_ID = '367186123307673',
        DEFAULT_ID = 'darublues', //'13601226661',
        ID_QUERY = 'id',
        POSTS_PER_ROW_QUERY = 'perrow',
        SERVICE_QUERY = 'service',
        FETCH_ALL_QUERY = 'all',
        POSTS_PER_ROW_DEFAULT = 10,
        SERVICE_DEFAULT = 'youtube', //'facebook',
        FETCH_ALL_DEFAULT = false,
        VIDEO_WIDTH = 385,
        VIDEO_HEIGHT = 315,
	currentService,
	mainContainer = $("#main"),
        box = $("#box"),
        serviceSelect = $("#serviceSelect"),
        lastCtx, // the last canvas context that we drew on
        bodyWidth = $('body').innerWidth() - $.getScrollbarWidth(),
	elementInfo = pojo('icon', 'name', 'description', 'link'),
        fetchAll = queryString.getParameterByName(window.location.href, FETCH_ALL_QUERY) || FETCH_ALL_DEFAULT,
        postsPerRow = queryString.getParameterByName(window.location.href, POSTS_PER_ROW_QUERY) || POSTS_PER_ROW_DEFAULT,
        postWidth = Math.floor(bodyWidth / postsPerRow), // cell width
        postHeight = postWidth, // cell height
        id = queryString.getParameterByName(window.location.href, ID_QUERY) || DEFAULT_ID,
	serviceName = queryString.getParameterByName(window.location.href, SERVICE_QUERY) || SERVICE_DEFAULT,
	matrices = matrixCollection(box, postWidth, postHeight, postsPerRow),
	lastElementClicked,
	userLink = {
		youtube :'http://www.youtube.com/user/',
		facebook :'http://www.facebook.com/'
	},
	logger = (function (el) {
		var add = function (message, color) {
			el.append($("<span/>").css({display: 'block', color: color}).html(message));
			el[0].scrollTop = el[0].scrollHeight; // scroll to the bottom
		};

		return {
			log: function (message) {
				add(message, 'black');
			}
		};
	}($("#logs"))),
	loader = (function (el) {
		return {
			show: function () {
				el.fadeIn();
			},
			hide: function () {
				el.fadeOut();
			}
		};
	}($("#loader"))),
	youtube = (function () {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight, loader, logger, fetchAll), 
		getVideoLink = function (links) {
			return links.forEach(function (link) {
				if (link.rel === "alternate") {
					return link.href;
				}
			});

			throw "No video link?";
		};

		base.startFetching = function (id) {
			return base.fetch('https://gdata.youtube.com/feeds/api/users/' + id + '/uploads?callback=?&alt=json');
		};
		base.getNextUrl = function (response) {
			return response.feed.link.forEach(function (link) {
				if (link.rel === "next") {
					return link.href;
				}
			});
		};

		base.formatTime = function (time) {
		    return time.substring(0, time.indexOf('T'));
		};

		base.getObjectInfo = function (id) {
		    $.getJSON('https://gdata.youtube.com/feeds/api/users/' + id + '?alt=json&callback=?', function (response) {
				    var entry = response.entry, username = entry.yt$username.$t;

				    base.renderInfo(elementInfo(entry.media$thumbnail.url, username, (entry.yt$description && entry.yt$description.$t) || "", 'http://www.youtube.com/user/' + username));
		    });
		};

		base.getValidLinks = function (response) {
			var validLinks = [];
			response.feed.entry.forEach(function (post) {
				var l = link(post.published.$t, post.title.$t, getVideoLink(post.link), post.author[0].name.$t, post.author[0].name.$t);
				validLinks.push(l);

			});

			return validLinks;
		};

		return base;
	}()),
	facebook = (function () {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight, loader, logger, fetchAll), token, isLoggedIn;

		base.setLoggedIn = function (accessToken) {
			if (!accessToken) {
				return;
			}

			isLoggedIn = true;
			token = accessToken;
		};

		base.submitWatchAction = function (url, success) {
		    if (!isLoggedIn) { // Only submit the action if the user is logged into Facebook
			return;
		    }

		    logger.log('Publishing watch action to Facebook');
		    $.ajax({
			url: "https://graph.facebook.com/me/video.watches",
			type: 'post',
			data: {
				access_token: token,
				video: url
			},
			success: function (response) {
				success && success();
			},
			error: function (response) {
				if (response.statusText === "OK") { // for whatever reason, the error function is being executed rather than the success even when the response is 200 OK -_- 
					success && success();
				}
			}
		    });
		};

		base.startFetching = function (id) {
			return base.fetch('https://graph.facebook.com/' + id + '/feed?access_token=' + token + '&callback=?');
		};

		base.formatTime = function (time) {
		    return time.substring(0, time.indexOf('T'));
		};

		base.getValidLinks = function (response) {
		    var validLinks = [];
		    logger.log('Received ' + response.data.length + ' posts from Facebook');
		    response.data.forEach(function (post) {
			if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
			    return;
			}

			validLinks.push(link(post.created_time, post.name, post.link, post.from.id, post.from.name));
		    });

		    logger.log('Filtered the list to ' + validLinks.length + ' posts which contain YouTube videos');

		    return validLinks;
	        };

		base.getNextUrl = function (response) {
				return response.paging && response.paging.next;
		};

		base.isLoggedIn = function (callback) {
			    FB.getLoginStatus(function (response) {
				if (response.status === 'connected') { // the user is both logged in to FB and has authorized this app
				    isLoggedIn = true;
				    token = response.authResponse.accessToken;
				    callback(token);
				} else { // the user is either not logged in to FB or is logged in but hasn't yet authorized this app
				    callback();
				}
			    });
		};

		base.getObjectInfo = function (id) {
		    $.getJSON('https://graph.facebook.com/' + id + '?access_token=' + token + '&callback=?', function (response) {
				    var pic = 'https://graph.facebook.com/' + response.id + '/picture';
		        base.renderInfo(elementInfo(pic, response.name, response.description, 'https://www.facebook.com/' + response.id));
		    });
		};

		return base;
	}()),
	error = (function () {
		var el = $("#error");

		return {
			show: function (message) {
				el.html(message).slideDown();
			},
			hide: function () {
				el.slideUp();
			}
		};
	}()),
        start = function (accessToken) {
            var groupInfo = currentService.getObjectInfo(id);

            $("#loggedInContent").css('display', 'block');
            $("#info").css('display', 'block');

	    facebook.setLoggedIn(accessToken);
            currentService.startFetching(id);
        },
	getSelectedServiceName = function () {
		return serviceSelect.val();
	},
    	getServiceFromName = function (serviceName) {
		switch (serviceName) {
			case "facebook" : return facebook;
			case "youtube" : return youtube;
		}

		return getServiceFromName(SERVICE_DEFAULT);
	},
	canvasMouseMove = function (e) {
		var element = matrices.getElementUnderMouse(e.pageX, e.pageY), $this = $(this);

		if (!element) {
		    $this.css({cursor: ''});
		    tooltip.hide();
		    return;
		}

		tooltip.show(e.pageX, e.pageY, element.name);

		$this.css({cursor: 'pointer'});
	},
	tooltip = (function () {
		var el = $("#tooltip").mousemove(canvasMouseMove);

		return {
			show: function (x, y, name) {
				el.css({display: 'block', left: x + 5, top: y + 5}).html(name);
			},
			hide: function () {
				el.css('display', 'none');
			}
		}
	}());

    FB.init({
        appId: APP_ID,
        status: true,
        cookie: true,
        xfbml: true,
        oauth: true
    });

    FB.Event.subscribe('auth.login', function (response) {
        var token = response.authResponse.accessToken;
	error.hide();
        start(response.authResponse.accessToken);
    });

    FB.Event.subscribe('auth.logout', function (response) {
        if (response.status !== "connected") { // for whatever reason, auth.logout triggers also after a login, and I only want to refresh after a 'real' logout
            location.href = location.href;
        }
    });


    // Load as you scroll
    $(window).scroll(function () {
        var margin = 300; // the margin should be >= 1 because in Firefox the scrollTop was never reaching the window height...always a step less; this addition compensates it.
        if (($(window).scrollTop() + margin) >= $(document).height() - $(window).height()) {
            currentService.fetch();
        }
    });

    $(window).keyup(function (e) {
        if (e.keyCode === 32) { // SPACE
            currentService.fetch();
        }
    });

    box.click(function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY), modalContents = $("<div/>"), youtubeElement, postedDate, link;

        if (!element) {
            return;
        }
	
	lastElementClicked = element;
	link = userLink[serviceName] + element.poster.id;

        postedDate = $("<p/>").addClass('post-date').html(currentService.formatTime(element.created));
        youtubeElement = youtubeEmbedBuilder.build(element.url, VIDEO_WIDTH, VIDEO_HEIGHT);
        modalContents.append(youtubeElement);
        modalContents.append($("<p/>").css({ 'padding-top': 5, float: 'right' }).html('Posted by <a href="' + link + '" target="_blank">' + element.poster.name + '</a>'));
        modalContents.append(postedDate);

	(function () {
		var dialog = modalContents.dialog({
			    title: element.name,
			    modal: true,
			    closeOnEscape: true,
			    width: 420,
			    height: 411,
			    resizable: false,
			    close: function () {
				    lastElementClicked.actionDone = false; // reset it so that an action request can be sent next time this video is opened in the dialog again.
				    dialog.remove();
			    }
		});
	}());
    });

    $("#query").watermark("ID");
    $("#videosPerRow").watermark("Videos per row");

    $("#fetchAll").button().click(function () {
		    $(this).val("Fetching all...").attr('disabled', true);
		    currentService.triggerFetchAll();
    });

    $("canvas").live("mousemove", canvasMouseMove);

    $("#beforeCollage").mousemove(tooltip.hide);
    $("#infoID").html(id);
    $("#infoService").html(serviceName);
    $("#infoPerRow").html(postsPerRow);

    $("#submitSearch").button();
    serviceSelect.val(serviceName);

    $("#youtubeEmbed").live('mousedown', function () {
		    if (!lastElementClicked.actionDone) {
			    lastElementClicked.actionDone = true; // this is so that we don't send multiple action requests; when the dialog containing this video is closed, this boolean is reset to that another action can be sent for this video should the dialog with this video is opened again.
			    facebook.submitWatchAction(lastElementClicked.url);
		    }
    });

    currentService = getServiceFromName(serviceName);

    facebook.isLoggedIn(function (accessToken) { // TODO: continue working here
	facebook.setLoggedIn(accessToken);
	if (!accessToken && serviceName === "facebook") { // user is trying to see videos from Facebook but is not logged in, so he can't
		error.show("You are trying to view videos from Facebook. Please login first using the button on the right side.");
		return;
	}

	start(accessToken);
    });

};
