var service = function (matrices, postsPerRow, box, bodyWidth, postWidth, postHeight, loader, logger, fetchAll) {
        var nextUrl,
	    lastCol = 0,
            lastRow = 0,
            lastCtx, drawImages = function (ctx, links, column, row) {
                var i = 0,
                    j = links.length;

                for (; i < j; ++i) {
                    if (!links[i]) {
                        continue;
                    }(function (ctx, link, startCol, startRow) {
			var img = new Image();
			img.onload = function () {
			    ctx.drawImage(img, startCol * postWidth, startRow * postHeight, postWidth, postHeight);
			};

			img.src = 'http://img.youtube.com/vi/' + youtubeEmbedBuilder.getVideoID(link) + '/0.jpg';
                    }(ctx, links[i].url, column, row));
                    column = (column + 1) % postsPerRow;
                    if (!column) {
                        row++;
                    }
                }
            },
            handleData = function (validLinks) {
                var left, previousCells, neededRows;

                if (!validLinks.length) {
                    return;
                }

                if (lastCol !== 0) { // we need to fill some empty spaces from the last page first
                    left = validLinks.shiftRange(Math.min(postsPerRow - lastCol, validLinks.length));
                    previousCells = matrices.elementAt(matrices.length() - 1).cells;

                    drawImages(lastCtx, left, lastCol, lastRow - 1, 1);
                    matrices.modifyCells(matrices.length() - 1, previousCells.concat(left));
                    lastCol = (lastCol + left.length) % postsPerRow;
                }

                if (!validLinks.length) {
                    return;
                }

                neededRows = Math.ceil(validLinks.length / postsPerRow);
                lastCol = validLinks.length % postsPerRow;
                lastRow = neededRows;

                // Create a new canvas to draw the newly recieved
                lastCtx = helpers.createCanvas(bodyWidth, neededRows * postHeight).getContext('2d');

                matrices.push(matrix(postsPerRow * postWidth, neededRows * postHeight, validLinks));
                box.append($(lastCtx.canvas));
                drawImages(lastCtx, validLinks, 0, 0);
                return validLinks.length;
            },
            fetch = function (url) {
	        var willCallHappen;

                if (!(url = url || nextUrl)) { // there is no next url, so don't fetch anything
		    logger.log('No more data to fetch');
		    loader.hide();
                    return;
                }

                loader.show();
                willCallHappen = requestHandler.fetch(url, function (response) {
		    logger.log('Fetch successful');
                    var validLinks = obj.getValidLinks(response);
                    nextUrl = obj.getNextUrl(response);

                    handleData(validLinks);

                    var totalHeightYet = matrices.getTotalHeight();
                    if (totalHeightYet < $(window).height()) { // we still haven't filled the first page yet, so continue fetching
                        return fetch();
                    }

                    if (fetchAll) {
                        fetch();
                    } else {
                        loader.hide();
                    }
                });

		if (willCallHappen) {
		    logger.log('Fetching from ' + url);
		}
            },
            buildTitle = function (name) {
                return "YouTube Collage - " + name;
            },
            obj = {
                getValidLinks: function (links) {
                    throw "No override";
                },
                getNextUrl: function (data) {
                    throw "No override";
                },
                startFetching: function (url) {
                    throw "No override";
                },
		triggerFetchAll: function () {
			 fetchAll = true;
			 fetch();
		},
                fetch: fetch,
                renderInfo: function (info) {
                    info.icon && $("#favicon").attr('href', info.icon);
                    $("title").html(buildTitle(info.name));
                    $("#grouptitle").html(info.name);
                    $("#groupdescription").html(info.description);
                    $("#grouplink").attr('href', info.link);
                },
            };

        return obj;
    };
