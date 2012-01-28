var service = function (matrices, postsPerRow, box, bodyWidth, postWidth, postHeight) {
        var nextUrl,
	    lastCol = 0,
            lastRow = 0,
            lastCtx, drawImages = function (ctx, links, column, row) {
                var i = 0, j = links.length;

                for (; i < j; ++i) {
                    if (!links[i]) {
                        continue;
                    }(function (ctx, link, startCol, startRow) {
                        var img = new Image();
                        img.onload = function () {
                            ctx.drawImage(img, startCol * postWidth, startRow * postHeight, postWidth, postHeight);
                        };

                        img.src = 'http://img.youtube.com/vi/' + youtubeEmbedBuilder.getVideoID(link) + '/0.jpg';
                    }(ctx, links[i].link, column, row));
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
                url = url || nextUrl;
                requestHandler.fetch(url, function (response) {
                    var validLinks = obj.getValidLinks(response.data);
                    nextUrl = obj.getNextUrl(response);
                    if (!validLinks.length) { // none of the links were valid; so, fetch more
                        fetch();
                        return;
                    }

                    handleData(validLinks);

                    var totalHeightYet = matrices.getTotalHeight();
                    if (totalHeightYet < $(window).height()) { // we still haven't filled the first page yet, so continue fetching
                        fetch();
                    }
                });
            },
            obj = {
                getValidLinks: function (links) {
		    // This function can be overridden
                    return links;
                },
                getNextUrl: function (data) {
                    throw "No override";
                },
                fetch: fetch
            };

        return obj;
};
