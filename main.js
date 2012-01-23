Array.prototype.shiftRange = function (n) {
	var out = [], i = 0;
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


        window.fbAsyncInit = function() {
	var mainContainer = $("#main"),
	    box = $("#box"),
	    lastCtx, // the last canvas context that we drew on
	    bodyWidth = $('body').innerWidth(),
	    POSTS_PER_ROW = 5,
	    postWidth = Math.floor(bodyWidth / POSTS_PER_ROW), // cell width
	    postHeight = postWidth, // column height
	    lastCol = 0,
	    lastRow = 0,
	    nextUrl,
	matrices = (function () {
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
					var m, i = 0, j = list.length, totalHeight = 0;
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
	    fetch = function(url) {
		console.log('URL: ' + url);
		$.getJSON(url, function (response) {
			nextUrl = response.paging.next; 
			handleData(response.data);
		});

	    },
	    start = function (accessToken) {
		console.log('starting');
		fetch('https://graph.facebook.com/13601226661/feed?access_token=' + accessToken);
	    }, isLoggedIn = function (callback) {
		FB.getLoginStatus(function(response) {
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
		var i = 0, j = data.length, validLinks = [], post, container;

		for (; i < j; ++i) {
			post = data[i];
			if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
				console.log('Skipping link: ', post.link);
				continue;
			}

			validLinks.push(post);
		}

		if (lastCol !== 0) { // we need to fill some empty spaces from the last page first
			var left = validLinks.shiftRange(POSTS_PER_ROW - lastCol), previousCells = matrices.elementAt(matrices.length() - 1).cells;
			drawImages(lastCtx, left, lastCol, lastRow - 1, 1);
			matrices.modifyCells(matrices.length() - 1, previousCells.concat(left));
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
	drawImages = function (ctx, links, c, r ) {
		var i = 0, j = links.length;
		for (; i < j; ++i) {
			(function (ctx, link, startCol, startRow) {
				var img = new Image();
				img.onload = function () {
					ctx.drawImage(img, startCol * postWidth, startRow * postHeight, postWidth, postHeight);
				};

				img.src = 'http://img.youtube.com/vi/' + youtubeEmbedBuilder.getVideoID(link) + '/0.jpg';
			} (ctx, links[i].link, c, r));
			c = (c + 1) % POSTS_PER_ROW;
			if (!c) {
				r++;
			}

			//container = generatePostContainer(post.link);
			//mainContainer.append(container);
		}
	},
	generatePostContainer = function (link) {
		var container = $("<div/>").attr("class", "post").css({width: postWidth}), youtube = youtubeEmbedBuilder.build(link, postWidth, 315);
		container.append(youtube);

		return container;
	};

	FB.init({ appId : '367186123307673', status : true, cookie : true, xfbml : true, oauth : true});

	FB.Event.subscribe('auth.login', function(response) {
		start(response.authResponse.accessToken);
	});

	isLoggedIn(function (accessToken) {
		if (accessToken) {
			start(accessToken);
		}
	});

	// Load as you scroll
	$(window).scroll(function(){
		if ($(window).scrollTop() == $(document).height() - $(window).height()){
		   fetch(nextUrl);
		}
	});

	box.click(function (e) {
			console.log(e.pageX, e.pageY);
			var element = matrices.getElementUnderMouse(e.pageX, e.pageY);
			if (!element) {
				return;
			}

			console.log(element);
			youtubeEmbedBuilder.build(element.link,postWidth, 315).dialog({title: element.name, modal: true, width: postWidth, height: 315, resizable: false}); 
	});
};
