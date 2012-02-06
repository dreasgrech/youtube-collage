var titleBuilder = (function () {
	var DELIMITER = ' - ',
	    title = $("title"),
	    defaultTitle = "YouTube Collage",
	    objectTitle,
	    getObjectTitle = function () {
	    	return defaultTitle + DELIMITER + objectTitle;
	    };

	    return {
		setObjectTitle: function (ot) {
			objectTitle = ot;
			title.html(getObjectTitle());
		},
		setVideoTitle: function (videoTitle) {
			var fullTitle = getObjectTitle() + (videoTitle ? (DELIMITER + videoTitle) : '');
			title.html(fullTitle);
		}
	    };
}());
