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
            var embedLink = 'http://www.youtube.com/v/' + getVideoID(link),
		container = $("<div/>"),//.attr('id', 'youtubeEmbed'),
                embed = $('<object id="youtubeEmbed" type="application/x-shockwave-flash" data="' + embedLink + '?version=3"/>').css({width: width, height: height});
            embed.append($('<param name="movie" value="' + embedLink + '?version=3" />'));
            embed.append($('<param name="allowFullScreen" value="true" />'));
            embed.append($('<param name="wmode" value="transparent" />'));
            embed.append($('<param name="allowscriptaccess" value="always" />'));
	    container.append(embed);
            return container;
        },
        isYoutubeLink: function (link) {
            if (isShortLink(link)) {
                return true;
            }

            /* 
	     * I took this regex from the Closure library: 
	     * http://closure-library.googlecode.com/svn-history/r8/trunk/closure/goog/docs/closure_goog_ui_media_youtube.js.source.html 
	     */
            return link.match(/https?:\/\/(?:[a-zA_Z]{2,3}.)?(?:youtube\.com\/watch\?)((?:[\w\d\-\_\=]+&amp;(?:amp;)?)*v(?:&lt;[A-Z]+&gt;)?=([0-9a-zA-Z\-\_]+))/i);
        },
        getVideoID: getVideoID
    };
}());
