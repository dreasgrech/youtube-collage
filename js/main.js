
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
        ID_QUERY = 'id',
        DEFAULT_ID = '13601226661',
        POSTS_PER_ROW_QUERY = 'perrow',
        POSTS_PER_ROW_DEFAULT = 10,
        VIDEO_WIDTH = 385,
        VIDEO_HEIGHT = 315,
	mainContainer = $("#main"),
        box = $("#box"),
        query = $("#query"),
        lastCtx, // the last canvas context that we drew on
        bodyWidth = $('body').innerWidth(),
        postsPerRow = queryString.getParameterByName(window.location.href, POSTS_PER_ROW_QUERY) || POSTS_PER_ROW_DEFAULT,
        postWidth = Math.floor(bodyWidth / postsPerRow), // cell width
        postHeight = postWidth, // cell height
        id = queryString.getParameterByName(window.location.href, ID_QUERY) || DEFAULT_ID,
        buildTitle = function (name) {
            return "GroupTubes - " + name;
        },
	matrices = matrixCollection(box, postWidth, postHeight, postsPerRow),
	youtube = (function () {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight);

		return base;
	}()),
	facebook = (function () {
		var base = service(matrices, postsPerRow, box, bodyWidth, postWidth, postHeight), token;

		base.formatTime = function (time) {
		    return time.substring(0, time.indexOf('T'));
		};

		base.getValidLinks = function (data) {
		    var i = 0, j = data.length, validLinks = [], post;

		    for (; i < j; ++i) {
			post = data[i];
			if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
			    continue;
			}

			validLinks.push(post);
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

		base.getObjectInfo = function (id, callback) {
		    callback && $.getJSON('https://graph.facebook.com/' + id + '?access_token=' + token + '&callback=?', function (response) {
			callback(response);
		    });
		};

		return base;
	}()),
        start = function (accessToken) {
            $("#login").dialog("destroy").css({ display: 'block', height: '', 'min-height': '', width: '' }) // remove the css that the dialog leaves
            .prependTo($('body'));
            var groupInfo = facebook.getObjectInfo(id, function (info) {
                info.icon && $("#favicon").attr('href', info.icon);
                $("title").html(buildTitle(info.name));
                $("#grouptitle").html(info.name);
                $("#groupdescription").html(info.description);
                $("#grouplink").attr('href', 'https://www.facebook.com/' + info.id);
            });

            $("#loggedInContent").css('display', 'block');

            facebook.fetch('https://graph.facebook.com/' + id + '/feed?access_token=' + accessToken + '&callback=?');
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
            facebook.fetch();
        }
    });

    $(window).keyup(function (e) {
        if (e.keyCode === 32) { // SPACE
            facebook.fetch();
        }
    });

    box.click(function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY), modalContents = $("<div/>"), youtubeElement, postedDate;

        if (!element) {
            return;
        }

        postedDate = $("<p/>").addClass('post-date').html(facebook.formatTime(element.created_time));
        youtubeElement = youtubeEmbedBuilder.build(element.link, VIDEO_WIDTH, VIDEO_HEIGHT);
        modalContents.append(youtubeElement);
        modalContents.append($("<p/>").css({ 'padding-top': 5, float: 'right' }).html('Posted by <a href="http://www.facebook.com/' + element.from.id + '" target="_blank">' + element.from.name + '</a>'));
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
        if (e.keyCode !== 13) {
            return;
        }

        var newLocation = location.protocol + '//' + location.host + location.pathname + '?' + ID_QUERY + '=' + query.val();
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

    /*$.ajax({
	url: 'https://gdata.youtube.com/feeds/api/users/darublues/uploads?callback=?&alt=json',
	dataType: 'jsonp',
	success: function (response) {
		console.log(response);
	}
    });*/

    //youtube.fetch('https://gdata.youtube.com/feeds/api/users/darublues/uploads?callback=?&alt=json');
};
