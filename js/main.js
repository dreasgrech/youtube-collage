Array.prototype.shiftRange = function(n) {
	var out = [],
	i = 0;

	for (; i < n; ++i) {
		out.push(this.shift());
	}

	return out;
};

Array.prototype.forEach = function(callback) {
	var i = 0,
	j = this.length,
	stop;
	for (; i < j; ++i) {
		if (stop = callback(this[i], i)) {
			return stop;
		}
	}
};

window.fbAsyncInit = function() {
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
	yPlayer = youtubePlayer(VIDEO_WIDTH, VIDEO_HEIGHT, 'youtubeEmbed'),
	currentService,
	mainContainer = $("#main"),
	box = $("#box"),
	serviceSelect = $("#serviceSelect"),
	nextButton = $("<div/>").attr({
		id: 'nextButton',
		title: 'Next video'
	}).addClass('playerButton'),
	previousButton = $("<div/>").attr({
		id: 'previousButton',
		title: 'Previous video'
	}).addClass('playerButton'),
	lastCtx,
	// the last canvas context that we drew on
	bodyWidth = $('body').innerWidth() - $.getScrollbarWidth(),
	elementInfo = pojo('icon', 'name', 'description', 'link'),
	queryStringValues = (function() {
		var url = window.location.href;

		// TODO: The getters on this should be functions so that they're read-only, but whatever.
		return {
			id: queryString.getParameterByName(window.location.href, ID_QUERY),
			service: queryString.getParameterByName(window.location.href, SERVICE_QUERY),
			fetchAll: queryString.getParameterByName(window.location.href, FETCH_ALL_QUERY),
			postsPerRow: queryString.getParameterByName(window.location.href, POSTS_PER_ROW_QUERY)
		};
	} ()),
	fetchAll = queryStringValues.fetchAll || FETCH_ALL_DEFAULT,
	postsPerRow = queryStringValues.postsPerRow || POSTS_PER_ROW_DEFAULT,
	postWidth = Math.floor(bodyWidth / postsPerRow), // cell width
	postHeight = postWidth, // cell height
	id = queryStringValues.id || DEFAULT_ID,
	serviceName = queryStringValues.service || SERVICE_DEFAULT,
	matrices = matrixCollection(box, postWidth, postHeight, postsPerRow),
	lastElementClicked,
	lastDialogOpened,
	userLink = {
		youtube: 'http://www.youtube.com/user/',
		facebook: 'http://www.facebook.com/'
	},
	logger = (function(el) {
		var add = function(message, color) {
			message = "> " + message;
			el.append($("<span/>").css({
				display: 'block',
				color: color
			}).html(message));
			el[0].scrollTop = el[0].scrollHeight; // scroll to the bottom
		};

		return {
			log: function(message) {
				add(message, '#EAEAEA');
			}
		};
	} ($("#logs"))),
	loader = (function(el) {
		return {
			show: function() {
				el.fadeIn();
			},
			hide: function() {
				el.fadeOut();
			}
		};
	} ($("#loader"))),
	youtube = (function() {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight, loader, logger, fetchAll),
		getVideoLink = function(links) {
			return links.forEach(function(link) {
				if (link.rel === "alternate") {
					return link.href;
				}
			});

			throw "No video link?";
		};

		base.startFetching = function(id) {
			return base.fetch('https://gdata.youtube.com/feeds/api/users/' + id + '/uploads?callback=?&alt=json');
		};
		base.getNextUrl = function(response) {
			return response.feed.link.forEach(function(link) {
				if (link.rel === "next") {
					return link.href;
				}
			});
		};

		base.formatTime = function(time) {
			return time.substring(0, time.indexOf('T'));
		};

		base.getObjectInfo = function(id) {
			$.getJSON('https://gdata.youtube.com/feeds/api/users/' + id + '?alt=json&callback=?', function(response) {
				var entry = response.entry,
				username = entry.yt$username.$t;

				base.renderInfo(elementInfo(entry.media$thumbnail.url, username, (entry.yt$description && entry.yt$description.$t) || "", 'http://www.youtube.com/user/' + username));
			});
		};

		base.getValidLinks = function(response) {
			var validLinks = [];
			response.feed.entry.forEach(function(post) {
                var feedId = post.id.$t, id = feedId.substring(feedId.lastIndexOf('/') + 1, feedId.length);
				validLinks.push(link(id, post.published.$t, post.title.$t, getVideoLink(post.link), post.author[0].name.$t, post.author[0].name.$t));
			});

			return validLinks;
		};

        base.getPermalink = function (id, callback) {
            callback("http://www.youtube.com/watch?v=" + id);
        };

		return base;
	} ()),
	facebook = (function() {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight, loader, logger, fetchAll),
		token,
		isLoggedIn;

		base.setLoggedIn = function(accessToken) {
			if (!accessToken) {
				return;
			}

			isLoggedIn = true;
			token = accessToken;
		};

		base.submitWatchAction = function(url, success) {
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
				success: function(response) {
					success && success();
				},
				error: function(response) {
					if (response.statusText === "OK") { // for whatever reason, the error function is being executed rather than the success even when the response is 200 OK -_- 
						success && success();
					}
				}
			});
		};

		base.startFetching = function(id) {
			return base.fetch('https://graph.facebook.com/' + id + '/feed?access_token=' + token + '&callback=?');
		};

		base.formatTime = function(time) {
			return time.substring(0, time.indexOf('T'));
		};

		base.getValidLinks = function(response) {
			var validLinks = [];
			logger.log('Received ' + response.data.length + ' posts from Facebook');
			response.data.forEach(function(post) {
				if (!post.link || ! youtubeEmbedBuilder.isYoutubeLink(post.link)) {
					return;
				}

				validLinks.push(link(post.id, post.created_time, post.name, post.link, post.from.id, post.from.name));
			});

			logger.log('Filtered the list to ' + validLinks.length + ' posts which contain YouTube videos');

			return validLinks;
		};

		base.getNextUrl = function(response) {
			return response.paging && response.paging.next;
		};

		base.isLoggedIn = function(callback) {
			FB.getLoginStatus(function(response) {
				if (response.status === 'connected') { // the user is both logged in to FB and has authorized this app
					isLoggedIn = true;
					token = response.authResponse.accessToken;
					callback(token);
				} else { // the user is either not logged in to FB or is logged in but hasn't yet authorized this app
					callback();
				}
			});
		};

		base.getObjectInfo = function(id) {
			$.getJSON('https://graph.facebook.com/' + id + '?access_token=' + token + '&callback=?', function(response) {
				var pic = 'https://graph.facebook.com/' + response.id + '/picture';
				base.renderInfo(elementInfo(pic, response.name, response.description, 'https://www.facebook.com/' + response.id));
			});
		};

        base.getPermalink = function (id, callback) {
            FB.api({
                method: 'fql.query',
                query: 'select permalink from stream where post_id="' + id + '"'
            },
            function(data) {
                callback(data[0].permalink);
            });
        };

		return base;
	} ()),
	error = (function() {
		var el = $("#error");

		return {
			show: function(message) {
				el.html(message).slideDown();
			},
			hide: function() {
				el.slideUp();
			}
		};
	} ()),
	start = function(accessToken) {
		var groupInfo = currentService.getObjectInfo(id);

		$("#loggedInContent").css('display', 'block');
		$("#info").css('display', 'block');

		facebook.setLoggedIn(accessToken);
		currentService.startFetching(id);
	},
	getSelectedServiceName = function() {
		return serviceSelect.val();
	},
	getServiceFromName = function(serviceName) {
		switch (serviceName) {
            case "facebook": return facebook;
            case "youtube": return youtube;
		}

		return getServiceFromName(SERVICE_DEFAULT);
	},
	canvasMouseMove = function(e) {
		var element = matrices.getElementUnderMouse(e.pageX, e.pageY),
		$this = $(this);

		if (!element) {
			$this.css({
				cursor: ''
			});
			tooltip.hide();
			return;
		}

		tooltip.show(e.pageX, e.pageY, element.name);

		$this.css({
			cursor: 'pointer'
		});
	},
	tooltip = (function() {
		var el = $("#tooltip").mousemove(canvasMouseMove);

		return {
			show: function(x, y, name) {
				el.css({
					display: 'block',
					left: x + 5,
					top: y + 5
				}).html(name);
			},
			hide: function() {
				el.css('display', 'none');
			}
		}
	} ()),
	constructVideoModalContents = function(element) {
		var modalContents = $("<div/>"),
		videoContainer = $("<div/>").attr('id', 'youtubeEmbed'),
		link = userLink[serviceName] + element.poster.id,
		postedBy = $("<p/>").css({ 'padding-top': 5, float: 'right'
		}).html('Posted by <a href="' + link + '" target="_blank">' + element.poster.name + '</a>'),
		postedDate = $("<p/>").addClass('post-date').html(currentService.formatTime(element.created)),
		buttonContainer = $("<div/>"),
		next = nextButton.clone(),
		previous = previousButton.clone();

		next.click(function() {
			addVideoToModalDialog(lastDialogOpened, getNextVideo(), true);
		});

		previous.click(function() {
			addVideoToModalDialog(lastDialogOpened, getPreviousVideo(), true);
		});

		buttonContainer.append(previous);
		buttonContainer.append(next);

		modalContents.append(videoContainer);
		modalContents.append(postedBy);
		modalContents.append(postedDate);
		modalContents.append($("<div/>").addClass("toclear"));
		modalContents.append(buttonContainer);

		return modalContents;
	},
	getPreviousVideo = function() {
		return matrices.getPreviousElement(lastElementClicked.index);
	},
	getNextVideo = function() {
		return matrices.getNextElement(lastElementClicked.index);
	},
	addVideoToModalDialog = function(dialog, element, autoPlay) {
		if (!element) {
			return;
		}

		var videoID = youtubeEmbedBuilder.getVideoID(element.url);

		titleBuilder.setVideoTitle(element.name); // Add the video name to the title of the page
		dialog.dialog({ title: element.name }); // Set the title of the modal dialog to the title of the video (without the permalink for now)
        currentService.getPermalink(element.id, function (permalink) {
            dialog.dialog({ title: '<a href="' + permalink + '" target="_blank">' + element.name + '</a>'});
        });

		dialog.html('').append(constructVideoModalContents(element));
		lastElementClicked = element;
		yPlayer.add(videoID, autoPlay, function() { // Play the next video once this one finishes
			var nextVideo = getNextVideo();
			if (!nextVideo) { // This video was the last one
				return;
			}

			addVideoToModalDialog(dialog, nextVideo, true);
		});
	},
	showVideoModalDialog = function(element, autoPlay) {
		lastDialogOpened = constructVideoModalContents(element).dialog({
			modal: true,
			closeOnEscape: true,
			width: 420,
			height: 441,
			resizable: false,
			open: function() {
				addVideoToModalDialog($(this), element, autoPlay);
			},
			close: function() {
				lastElementClicked.actionDone = false; // reset it so that an action request can be sent next time this video is opened in the dialog again.
				lastDialogOpened.remove();
				titleBuilder.setVideoTitle(); // Remove the video name from the title of the page
			}
		});

	};

	FB.init({
		appId: APP_ID,
		status: true,
		cookie: true,
		xfbml: true,
		oauth: true
	});

	FB.Event.subscribe('auth.login', function(response) {
		var accessToken = response.authResponse.accessToken;
		error.hide();
		facebook.setLoggedIn(accessToken);
		start(accessToken);
	});

	FB.Event.subscribe('auth.logout', function(response) {
		if (response.status !== "connected") { // for whatever reason, auth.logout triggers also after a login, and I only want to refresh after a 'real' logout
			location.href = location.href;
		}
	});

	// Load as you scroll
	$(window).scroll(function() {
		var margin = 300; // the margin should be >= 1 because in Firefox the scrollTop was never reaching the window height...always a step less; this addition compensates it.
		if (($(window).scrollTop() + margin) >= $(document).height() - $(window).height()) {
			currentService.fetch();
		}
	});

	$(window).keyup(function(e) {
		if (e.keyCode === 32) { // SPACE
			currentService.fetch();
		}
	});

	box.click(function(e) {
		var element = matrices.getElementUnderMouse(e.pageX, e.pageY);

		if (!element) {
			return;
		}

		showVideoModalDialog(element, false);
	});

	$("#query").watermark("ID").val(queryStringValues.id);
	$("#videosPerRow").watermark("Videos per row").val(queryStringValues.postsPerRow);

	$("#fetchAll").button().click(function() {
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

	$("#youtubeEmbed").live('mousedown', function() {
		if (!lastElementClicked.actionDone) {
			lastElementClicked.actionDone = true; // this is so that we don't send multiple action requests; when the dialog containing this video is closed, this boolean is reset to that another action can be sent for this video should the dialog with this video is opened again.
			facebook.submitWatchAction(lastElementClicked.url);
		}
	});

	currentService = getServiceFromName(serviceName);

	facebook.isLoggedIn(function(accessToken) { /// TODO: this callback is not always being invoked?
		facebook.setLoggedIn(accessToken);
		if (!accessToken && serviceName === "facebook") { // user is trying to see videos from Facebook but is not logged in, so he can't
			error.show("You are trying to view videos from Facebook. Please login first using the button on the right side.");
			return;
		}

		start(accessToken);
	});

};


