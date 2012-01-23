var queryString = (function () {
    return {
        getParameterByName: function (link, name) {
            // http://stackoverflow.com/a/901144/44084
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(link);
            if (results == null) {
                return "";
            } else {
                return decodeURIComponent(results[1].replace(/\+/g, " "));
            }
        }

    };
}());
