        window.fbAsyncInit = function() {
	var mainContainer = $("#main"),
	    bodyWidth = $("body").outerWidth(),
	    POSTS_PER_ROW = 5,
	    postWidth = Math.floor(bodyWidth / POSTS_PER_ROW) - 4,
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
	handleData = function (data) {
		var i = 0, j = data.length, post, container;
		for (; i < j; ++i) {
			post = data[i];
			if (!post.link || !youtubeEmbedBuilder.isYoutubeLink(post.link)) {
				continue;
			}

			container = generatePostContainer(post.link);
			mainContainer.append(container);
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
