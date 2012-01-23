var youtubeEmbedBuilder = (function () {

	var getParameterByName = function (link, name)
	{
	  // http://stackoverflow.com/a/901144/44084
	  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	  var regexS = "[\\?&]" + name + "=([^&#]*)";
	  var regex = new RegExp(regexS);
	  var results = regex.exec(link);
	  if(results == null) {
	    return "";
	  }
	  else {
	    return decodeURIComponent(results[1].replace(/\+/g, " "));
	  }
	}, getVideoID = function (link) {
		return getParameterByName(link, 'v');
	};

		return {
			build: function (link, width, height) {
				var embedLink = 'http://www.youtube.com/v/' + getVideoID(link), embed = $('<object type="application/x-shockwave-flash" style="width:' + width + 'px; height:' + height + 'px;" data="' + embedLink + '?version=3"/>');
				embed.append($('<param name="movie" value="' + embedLink + '?version=3" />'));
				embed.append($('<param name="allowFullScreen" value="true" />'));
				embed.append($('<param name="allowscriptaccess" value="always" />'));
				return embed;
			},
			isYoutubeLink: function (link) {
					       // http://stackoverflow.com/a/2964758/44084
					       return link.match(/^http:\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/);
		       },
		       getVideoID: getVideoID
		};
}());
