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
        ID_QUERY = 'id',
        DEFAULT_ID = '13601226661',
        POSTS_PER_ROW_QUERY = 'perrow',
        POSTS_PER_ROW_DEFAULT = 10,
        postsPerRow = queryString.getParameterByName(window.location.href, POSTS_PER_ROW_QUERY) || POSTS_PER_ROW_DEFAULT,
        VIDEO_WIDTH = 385,
        VIDEO_HEIGHT = 315,
        postWidth = Math.floor(bodyWidth / postsPerRow), // cell width
        postHeight = postWidth, // column height
        isRequestInProgess = false,
        lastCol = 0,
        lastRow = 0,
        id = queryString.getParameterByName(window.location.href, ID_QUERY) || DEFAULT_ID,
        getElementAbsoluteY = function (el) {
            var y = 0;
            while (el != null) {
                y += el.offsetTop;
                el = el.offsetParent;
            }

            return y;
        },
        buildTitle = function (name) {
            return "GroupTubes - " + name;
        },
        nextUrl, matrices = (function () {
            var list = [], // holds the list of matrices
                getTotalHeight = function () {
                    var i = 0,
                        j = list.length,
                        total = getElementAbsoluteY(box.find("canvas")[0]);
                    for (; i < j; ++i) {
                        total += list[i].getHeight();
                    }

                    return total;
                };
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
                        totalHeight = getElementAbsoluteY(box.find("canvas")[0]);
                    for (; i < j; ++i) {
                        if (totalHeight + list[i].getHeight() > clickY) {
                            m = list[i];
                            break;
                        }

                        totalHeight += list[i].getHeight();
                    }
                    if (!m) {
                        return;
                    }

                    var yPosInM = clickY - totalHeight;
                    var matrixCell = Math.ceil(clickX / postWidth) - 1;
                    var matrixRow = Math.ceil(yPosInM / postHeight) - 1;

                    return m.cells[(matrixRow * postsPerRow) + matrixCell];
                },
                getTotalHeight: getTotalHeight
            };
        }()),
        fetch = function (url) {
            if (isRequestInProgess) { // A fetch is already in progress so skip this command
                return;
            }

            if (!url) { // We're done; no more links
                return;
            }

            isRequestInProgess = true;

            $.ajax({
                url: url,
                dataType: 'jsonp',
                success: function (response) {
                    nextUrl = response.paging && response.paging.next;
                    isRequestInProgess = false;
                    var numberOfValidLinks = handleData(response.data);
                    if (!numberOfValidLinks) { // none of the links were valid; so, fetch more
                        fetch(nextUrl);
                        return;
                    }

                    var totalHeightYet = matrices.getTotalHeight();
                    if (totalHeightYet < $(window).height()) { // we still haven't filled the first page yet, so continue fetching
                        fetch(nextUrl);
                    }
                }
            });
        },
        start = function (accessToken) {
            $("#login").dialog("destroy").css({ display: 'block', height: '', 'min-height': '', width: '' }) // remove the css that the dialog leaves
            .prependTo($('body'));
            var groupInfo = getGroupInfo(id, accessToken, function (info) {
                info.icon && $("#favicon").attr('href', info.icon);
                $("title").html(buildTitle(info.name));
                $("#grouptitle").html(info.name);
                $("#groupdescription").html(info.description);
                $("#grouplink").attr('href', 'https://www.facebook.com/' + info.id);
            });

            $("#loggedInContent").css('display', 'block');

            fetch('https://graph.facebook.com/' + id + '/feed?access_token=' + accessToken + '&callback=?');
        },
        getGroupInfo = function (id, accessToken, callback) {
            callback && $.getJSON('https://graph.facebook.com/' + id + '?access_token=' + accessToken + '&callback=?', function (response) {
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
        formatFacebookTime = function (fbtime) {
            return fbtime.substring(0, fbtime.indexOf('T'));
        },
        createCanvas = function (width, height) {
            var canvas = document.createElement('canvas');
            canvas.className += "canvas";
            canvas.width = width;
            canvas.height = height;

            return canvas;
        },
        handleData = function (data) {
            var i = 0, j = data.length, validLinks = [], post, container;

            for (; i < j; ++i) {
                post = data[i];
                if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
                    continue;
                }

                validLinks.push(post);
            }

            if (!validLinks.length) {
                return;
            }

            if (lastCol !== 0) { // we need to fill some empty spaces from the last page first
                var left = validLinks.shiftRange(Math.min(postsPerRow - lastCol, validLinks.length)),
                    previousCells = matrices.elementAt(matrices.length() - 1).cells;

                drawImages(lastCtx, left, lastCol, lastRow - 1, 1);
                matrices.modifyCells(matrices.length() - 1, previousCells.concat(left));
                lastCol = (lastCol + left.length) % postsPerRow;
            }

            if (!validLinks.length) {
                return;
            }

            var neededRows = Math.ceil(validLinks.length / postsPerRow);
            lastCol = validLinks.length % postsPerRow;
            lastRow = neededRows;

            // Create a new canvas to draw the newly recieved
            lastCtx = createCanvas(bodyWidth, neededRows * postHeight).getContext('2d');

            matrices.push(matrix(postsPerRow * postWidth, neededRows * postHeight, validLinks));
            box.append($(lastCtx.canvas));
            drawImages(lastCtx, validLinks, 0, 0);
            return validLinks.length;
        },
        drawImages = function (ctx, links, c, r) {
            var i = 0, j = links.length;
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
                c = (c + 1) % postsPerRow;
                if (!c) {
                    r++;
                }
            }
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
            fetch(nextUrl);
        }
    });

    $(window).keyup(function (e) {
        if (e.keyCode === 32) { // SPACE
            fetch(nextUrl);
        }
    });

    box.click(function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY),
            modalContents = $("<div/>"),
            youtubeElement, postedDate;
        if (!element) {
            return;
        }

        postedDate = $("<p/>").addClass('post-date').html(formatFacebookTime(element.created_time));
        youtubeElement = youtubeEmbedBuilder.build(element.link, VIDEO_WIDTH, VIDEO_HEIGHT);
        modalContents.append(youtubeElement);
        modalContents.append($("<p/>").css({
            'padding-top': 5,
            float: 'right'
        }).html('Posted by <a href="http://www.facebook.com/' + element.from.id + '" target="_blank">' + element.from.name + '</a>'));
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

    groupQuery.watermark(id);
    groupQuery.keyup(function (e) {
        if (e.keyCode !== 13) {
            return;
        }

        var newLocation = location.protocol + '//' + location.host + location.pathname + '?' + ID_QUERY + '=' + groupQuery.val();
        location.href = newLocation;
    });

    $("canvas").live("mousemove", function (e) {
        var element = matrices.getElementUnderMouse(e.pageX, e.pageY),
            $this = $(this);
        if (!element) {
            $this.css({
                cursor: ''
            });
            return;
        }

        $this.css({
            cursor: 'pointer'
        });
    });

};
