Array.prototype.shiftRange = function (n) {
	var out = [], i = 0;
	for (; i < n; ++i) {
		out.push(this.shift());
	}

	return out;
};

        window.fbAsyncInit = function() {
	var mainContainer = $("#main"),
	    box = $("#box"),
	    lastCtx, // the last canvas context that we drew on
	    bodyWidth = $('body').innerWidth(),
	    POSTS_PER_ROW = 5,
	    postWidth = Math.floor(bodyWidth / POSTS_PER_ROW),
	    lastCol = 0,
	    lastRow = 0,
	    nextUrl,
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
				continue;
			}

			validLinks.push(post);
		}


		console.log('Valid links: ', validLinks.length);
		if (lastCol !== 0) { // we need to fill some empty spaces from the last page first
			var left = validLinks.shiftRange(POSTS_PER_ROW - lastCol);
			//drawImages(lastCtx, left, lastCol, lastRow);
			drawImages(lastCtx, left, lastCol, lastRow - 1, 1);
		} 

		var neededRows = Math.ceil(validLinks.length / POSTS_PER_ROW);
		lastCol = validLinks.length % POSTS_PER_ROW;
		lastRow = neededRows;
		// Create a new canvas to draw the newly recieved
		lastCtx = createCanvas(bodyWidth, neededRows * postWidth).getContext('2d');

		box.append($(lastCtx.canvas));
		drawImages(lastCtx, validLinks, 0, 0);
    	},
	drawImages = function (ctx, links, c, r ) {
		var i = 0, j = links.length;
		console.log(ctx.canvas);
		console.log('links length', j);
		for (; i < j; ++i) {
			(function (ctx, link, startCol, startRow) {
				var img = new Image();
				img.onload = function () {
					console.log(startCol * postWidth, startRow * postWidth);
					ctx.drawImage(img, startCol * postWidth, startRow * postWidth, postWidth, postWidth);
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
};
