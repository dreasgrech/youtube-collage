(function (global) {

    global.youtubePlayers = {};

    global.youtubePlayer = function (width, height, playerID) {
        var onFinish, autoStartVideo;

        youtubePlayers[playerID] = (function (pId) {
            return {
	            onReady: function () {
		    	if (autoStartVideo) {
				$('#' + pId)[0].playVideo();
			}
		    },
	            onStateChange: function (newState) {
		        if (!newState) {
				onFinish && onFinish();
			}
		    }
	    };
	}(playerID));

        return {
            add: function (videoID, autoStart, onFinishCallback) {
                onFinish = onFinishCallback;
		autoStartVideo = autoStart;
                swfobject.embedSWF("http://www.youtube.com/v/" + videoID + "?enablejsapi=1&playerapiid=" + playerID + "&version=3", "youtubeEmbed", width, height, "8", null, null, { allowScriptAccess: "always", wmode: "transparent" }, { id: playerID });
            }
        };
    };

    global.onYouTubePlayerReady = function (playerId) { // This function needs to be global becaue of how the YouTube JS API works -_-
        var ytplayer = $("#" + playerId)[0], evalString = "youtubePlayers['" + playerId + "'].onStateChange";
        ytplayer.addEventListener("onStateChange", evalString); // BEWARE: You cannot pass a reference to a function as the second parameter here; it's only happy with a string containing the name of another global function.  Yea, the YouTube JS API is a crock of shite.
	youtubePlayers[playerId].onReady();
    }
}(window));
