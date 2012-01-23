var youtubeEmbedBuilder = (function () {
        var isShortLink = function (link) {
            return link.indexOf('youtu\.be') >= 0; // TODO: use regular expressions for better matching
        },
        getShortLinkVideoID = function (link) {
            var slashPosition = link.lastIndexOf('/');
            return link.substring(slashPosition + 1);
        },
        getVideoID = function (link) {
            if (isShortLink(link)) {
                return getShortLinkVideoID(link);
            }

            return queryString.getParameterByName(link, 'v');
        };

    return {
        build: function (link, width, height) {
	console.log(width, height);
            var embedLink = 'http://www.youtube.com/v/' + getVideoID(link),
		container = $("<div/>"),
                embed = $('<object type="application/x-shockwave-flash" data="' + embedLink + '?version=3"/>').css({width: width, height: height});
            embed.append($('<param name="movie" value="' + embedLink + '?version=3" />'));
            embed.append($('<param name="allowFullScreen" value="true" />'));
            embed.append($('<param name="allowscriptaccess" value="always" />'));
	    container.append(embed);
            return container;
        },
        isYoutubeLink: function (link) {
            if (isShortLink(link)) {
                return true;
            }

            // http://stackoverflow.com/a/2964758/44084
            return link.match(/^http(s?):\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/); // That (s?) is not tested yet.
        },
        getVideoID: getVideoID
    };
}());
