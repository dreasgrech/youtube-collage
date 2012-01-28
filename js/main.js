
Array.prototype.shiftRange = function (n) {
    var out = [],
        i = 0;
    for (; i < n; ++i) {
        out.push(this.shift());
    }

    return out;
};

window.fbAsyncInit = function () {
    var APP_ID = '367186123307673',
        DEFAULT_ID = '13601226661',
        ID_QUERY = 'id',
        POSTS_PER_ROW_QUERY = 'perrow',
        SERVICE_QUERY = 'service',
        POSTS_PER_ROW_DEFAULT = 10,
        SERVICE_DEFAULT = "facebook",
        VIDEO_WIDTH = 385,
        VIDEO_HEIGHT = 315,
	currentService,
	mainContainer = $("#main"),
        box = $("#box"),
        query = $("#query"),
        serviceSelect = $("#serviceSelect"),
        lastCtx, // the last canvas context that we drew on
        bodyWidth = $('body').innerWidth(),
        postsPerRow = queryString.getParameterByName(window.location.href, POSTS_PER_ROW_QUERY) || POSTS_PER_ROW_DEFAULT,
        postWidth = Math.floor(bodyWidth / postsPerRow), // cell width
        postHeight = postWidth, // cell height
        id = queryString.getParameterByName(window.location.href, ID_QUERY) || DEFAULT_ID,
	serviceName = queryString.getParameterByName(window.location.href, SERVICE_QUERY) || SERVICE_DEFAULT,
	matrices = matrixCollection(box, postWidth, postHeight, postsPerRow),
	youtube = (function () {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight), 
		getVideoLink = function (links) {
			var i = 0, j = links.length;
			for (; i < j; ++i) {
				if (links[i].rel === "alternate") {
					return links[i].href;
				}
			}

			throw "No video link?";
		};

		base.startFetching = function (id) {
			return base.fetch('https://gdata.youtube.com/feeds/api/users/' + id + '/uploads?callback=?&alt=json');
		};
		base.getNextUrl = function (response) {
			var links = response.feed.link, i = 0, j = links.length;
			for (; i < j; ++i) {
				if (links[i].rel === "next") {
					return links[i].href;
				}
			}

		};

		base.formatTime = function (time) {
		    return time.substring(0, time.indexOf('T'));
		};

		base.getObjectInfo = function (id) {
		    $.getJSON('https://gdata.youtube.com/feeds/api/users/' + id + '?alt=json&callback=?', function (response) {
				    var entry = response.entry, username = entry.yt$username.$t;

				    base.renderInfo(elementInfo(entry.media$thumbnail.url, username, entry.yt$description.$t, 'http://www.youtube.com/user/' + username));
		    });
		};

		base.getValidLinks = function (response) {
			var entries = response.feed.entry, i = 0, j = entries.length, validLinks = [], post;
			for(; i < j; ++i) {
				post = entries[i];
				var l = link(post.published.$t, post.title.$t, getVideoLink(post.link), post.author[0].name.$t, post.author[0].name.$t);
				validLinks.push(l);
			}

			return validLinks;
		};

		return base;
	}()),
	facebook = (function () {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight), token;

		base.startFetching = function (id) {
			return base.fetch('https://graph.facebook.com/' + id + '/feed?access_token=' + token + '&callback=?');
		};

		base.formatTime = function (time) {
		    return time.substring(0, time.indexOf('T'));
		};

		base.getValidLinks = function (response) {
		    var links = response.data, i = 0, j = links.length, validLinks = [], post;

		    for (; i < j; ++i) {
			post = links[i];
			if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
			    continue;
			}

			validLinks.push(link(post.created_time, post.name, post.link, post.from.id, post.from.name));
		    }

		    return validLinks;
	        };

		base.getNextUrl = function (response) {
				return response.paging && response.paging.next;
		};

		base.isLoggedIn = function (callback) {
			    FB.getLoginStatus(function (response) {
				if (response.status === 'connected') { // the user is both logged in to FB and has authorized this app
				    token = response.authResponse.accessToken;
				    callback(token);
				} else { // the user is either not logged in to FB or is logged in but hasn't yet authorized this app
				    callback();
				}
			    });
		};

		base.accessToken = function (at) {
			if (at) {
				token = at;
			}

			return token;
		};

		base.getObjectInfo = function (id) {
		    $.getJSON('https://graph.facebook.com/' + id + '?access_token=' + token + '&callback=?', function (response) {
		        base.renderInfo(elementInfo(response.icon, response.name, response.description, 'https://www.facebook.com/' + response.id));
		    });
		};

		return base;
	}()),
        start = function (accessToken) {
            $("#login").dialog("destroy").css({ display: 'block', height: '', 'min-height': '', width: '' }) // remove the css that the dialog leaves
            .prependTo($('body'));
            var groupInfo = currentService.getObjectInfo(id);

            $("#loggedInContent").css('display', 'block');

	    facebook.accessToken(accessToken);
            currentService.startFetching(id);
        },
	getSelectedServiceName = function () {
		return serviceSelect.val();
	}
    	getServiceFromName = function (serviceName) {
		switch (serviceName) {
			case "facebook" : return facebook;
			case "youtube" : return youtube;
		}

		return getServiceFromName(SERVICE_DEFAULT);
	};

    FB.init({
        appId: APP_ID,
        status: true,
        cookie: true,
        xfbml: true,
        oauth: true
    });

    FB.Event.subscribe('auth.login', function (response) {
        start(response.authResponse.accessToken);
    });

    FB.Event.subscribe('auth.logout', function (response) {
        if (response.status !== "connected") { // for whatever reason, auth.logout triggers also after a login, and I only want to refresh after a 'real' logout
            location.href = location.href;
        }
    });

    facebook.isLoggedIn(function (accessToken) {
        if (accessToken) {
            start(accessToken);
        } else {
            $("#login").dialog({
                title: "",
                modal: true,
                width: 106,
                resizable: false,
                open: function (event, ui) {
                    $(".ui-dialog").css({ width: 106, height: 45 });
                    $(".ui-dialog-titlebar-close").hide();
                    $(".ui-dialog-titlebar").hide();
                }
            });
        }
    });

    // Load as you scroll
    $(window).scroll(function () {
        if (($(window).scrollTop() + 1) >= $(document).height() - $(window).height()) { // the ( + 1) is because in Firefox, the scrollTop was never reaching the window height...always a step less; this addition compensates it.
            currentService.fetch();
        }
    });

    $(window).keyup(function (e) {
        if (e.keyCode === 32) { // SPACE
            currentService.fetch();
        }
    });

    box.click(function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY), modalContents = $("<div/>"), youtubeElement, postedDate;

        if (!element) {
            return;
        }

        postedDate = $("<p/>").addClass('post-date').html(currentService.formatTime(element.created));
        youtubeElement = youtubeEmbedBuilder.build(element.url, VIDEO_WIDTH, VIDEO_HEIGHT);
        modalContents.append(youtubeElement);
        modalContents.append($("<p/>").css({ 'padding-top': 5, float: 'right' }).html('Posted by <a href="http://www.facebook.com/' + element.poster.id + '" target="_blank">' + element.poster.name + '</a>'));
        modalContents.append(postedDate);

        modalContents.dialog({
            title: element.name,
            modal: true,
            closeOnEscape: true,
            width: 420,
            height: 411,
            resizable: false
        });
    });

    query.watermark(id);
    query.keyup(function (e) {
        var newLocation;

        if (e.keyCode !== 13) {
            return;
        }

        newLocation = location.protocol + '//' + location.host + location.pathname + '?' + ID_QUERY + '=' + query.val() + '&' + SERVICE_QUERY + '=' + getSelectedServiceName();
        location.href = newLocation;
    });

    $("canvas").live("mousemove", function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY), $this = $(this);

        if (!element) {
            $this.css({cursor: ''});
            return;
        }

        $this.css({cursor: 'pointer'});
    });

    $("#infoID").html(id);
    $("#infoService").html(serviceName);
    $("#infoPerRow").html(postsPerRow);
    console.log(postsPerRow);

    currentService = getServiceFromName(serviceName);
};
