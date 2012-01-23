Array.prototype.shiftRange = function (n) {
    var out = [],
        i = 0;
    for (; i < n; ++i) {
        out.push(this.shift());
    }

    return out;
};

var matrix = function (width, height, cells) {

        return {
            getWidth: function () {
                return width;
            },
            getHeight: function () {
                return height;
            },
            cells: cells
        };
    };


window.fbAsyncInit = function () {
    var mainContainer = $("#main"),
        box = $("#box"),
	groupQuery = $("#groupquery"),
        lastCtx, // the last canvas context that we drew on
        bodyWidth = $('body').innerWidth(),
        GROUPID_QUERY = 'groupid',
        POSTS_PER_ROW = 5,
        postWidth = Math.floor(bodyWidth / POSTS_PER_ROW),
        // cell width
        postHeight = postWidth,
        // column height
        lastCol = 0,
        lastRow = 0,
	DEFAULT_GROUP_ID = '13601226661',
	groupID = queryString.getParameterByName(window.location.href, GROUPID_QUERY) || DEFAULT_GROUP_ID,
	getElementAbsoluteY = function(oElement) {
		var iReturnValue = 0;
		while( oElement != null ) {
			iReturnValue += oElement.offsetTop;
			oElement = oElement.offsetParent;
		}
		return iReturnValue;
	},
        nextUrl, matrices = (function () {
            var list = []; // holds the list of matrices
            return {
                push: function (m) {
                    list.push(m);
                },
                elementAt: function (n) {
                    return list[n];
                },
                modifyCells: function (n, newCells) {
                    list[n].cells = newCells;
                },
                length: function () {
                    return list.length;
                },
                getElementUnderMouse: function (clickX, clickY) {
                    var m, i = 0,
                        j = list.length,
                        //totalHeight = 0;
                        totalHeight = getElementAbsoluteY(box.find("canvas")[0]);
                    for (; i < j; ++i) {
                        if (totalHeight + list[i].getHeight() > clickY) {
                            m = list[i];
                            break;
                        }

                        totalHeight += list[i].getHeight();
                    }

                    var yPosInM = clickY - totalHeight;
                    var matrixCell = Math.ceil(clickX / postWidth) - 1;
                    var matrixRow = Math.ceil(yPosInM / postHeight) - 1;

                    return m.cells[(matrixRow * POSTS_PER_ROW) + matrixCell];
                }
            };
        }()),
        fetch = function (url) {
            console.log('Fetching ' , url);
            $.getJSON(url, function (response) {
                nextUrl = response.paging && response.paging.next;
                handleData(response.data);
            });
        },
        start = function (accessToken) {
            console.log('starting');
	    var groupInfo = getGroupInfo(groupID, accessToken, function (info) {
			    //console.log(info);
			    $("#grouptitle").html(info.name);
			    $("#groupdescription").html(info.description);
			    $("#grouplink").attr('href', 'https://www.facebook.com/groups/' + info.id);
	    });

	    $("#loggedInContent").css('display', 'block');

            fetch('https://graph.facebook.com/' + groupID + '/feed?access_token=' + accessToken);
        },
	getGroupInfo = function (id, accessToken, callback) {
            callback && $.getJSON('https://graph.facebook.com/' + groupID + '?access_token=' + accessToken, function (response) {
			    callback(response);
            });
	},
        isLoggedIn = function (callback) {
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    callback(response.authResponse.accessToken);
                } else {
                    callback();
                }
            });
        },
        createCanvas = function (width, height) {
            var canvas = document.createElement('canvas');
            canvas.className += "canvas";
            canvas.width = width;
            canvas.height = height;

            return canvas;
        },
        handleData = function (data) {
            var i = 0,
                j = data.length,
                validLinks = [],
                post, container;

            for (; i < j; ++i) {
                post = data[i];
                if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
                    //console.log('Skipping link: ', post.link);
                    continue;
                }

                validLinks.push(post);
            }

		if (!validLinks.length) {
			return;
		}

            if (lastCol !== 0) { // we need to fill some empty spaces from the last page first
                var left = validLinks.shiftRange(Math.min(POSTS_PER_ROW - lastCol, validLinks.length)),
                    previousCells = matrices.elementAt(matrices.length() - 1).cells;
                drawImages(lastCtx, left, lastCol, lastRow - 1, 1);
                matrices.modifyCells(matrices.length() - 1, previousCells.concat(left));
		lastCol = (lastCol + left.length) % POSTS_PER_ROW;
            }

	    if (!validLinks.length) {
		    return;
	    }

            var neededRows = Math.ceil(validLinks.length / POSTS_PER_ROW);
            lastCol = validLinks.length % POSTS_PER_ROW;
            lastRow = neededRows;

            // Create a new canvas to draw the newly recieved
            lastCtx = createCanvas(bodyWidth, neededRows * postHeight).getContext('2d');

            matrices.push(matrix(POSTS_PER_ROW * postWidth, neededRows * postHeight, validLinks));
            box.append($(lastCtx.canvas));
            drawImages(lastCtx, validLinks, 0, 0);
        },
        drawImages = function (ctx, links, c, r) {
            var i = 0,
                j = links.length;
            for (; i < j; ++i) {
		    if (!links[i]) {
			    continue;
		    }
                (function (ctx, link, startCol, startRow) {
                    var img = new Image();
                    img.onload = function () {
                        ctx.drawImage(img, startCol * postWidth, startRow * postHeight, postWidth, postHeight);
                    };

                    img.src = 'http://img.youtube.com/vi/' + youtubeEmbedBuilder.getVideoID(link) + '/0.jpg';
                }(ctx, links[i].link, c, r));
                c = (c + 1) % POSTS_PER_ROW;
                if (!c) {
                    r++;
                }

                //container = generatePostContainer(post.link);
                //mainContainer.append(container);
            }
        },
        generatePostContainer = function (link) {
            var container = $("<div/>").attr("class", "post").css({
                width: postWidth
            }),
                youtube = youtubeEmbedBuilder.build(link, postWidth, 315);
            container.append(youtube);

            return container;
        };

    FB.init({
        appId: '367186123307673',
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

    isLoggedIn(function (accessToken) {
        if (accessToken) {
            start(accessToken);
        }
    });

    // Load as you scroll
    $(window).scroll(function () {
        if (($(window).scrollTop() + 1) >= $(document).height() - $(window).height()) { // the ( + 1) is because in Firefox, the scrollTop was never reaching the window height...always a step less; this addition compensates it.
            fetch(nextUrl);
        }
    });

    box.click(function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY);
        if (!element) {
            return;
        }

        youtubeEmbedBuilder.build(element.link, postWidth, 315).dialog({
            title: element.name,
            modal: true,
            closeOnEscape: true,
            width: 420,
            height: 378,
            resizable: false
        });
    });

    groupQuery.watermark(groupID);
    groupQuery.keyup(function (e) {
	    if (e.keyCode !== 13) {
	    	return;
	    }

	    var newLocation = location.protocol + '//' + location.host + location.pathname + '?' + GROUPID_QUERY + '=' + groupQuery.val();
	    location.href = newLocation;
    });

    $(window).keyup(function (e) {
	    if (e.keyCode === 32) { // SPACE
		    fetch(nextUrl);
	    }
    });
};
