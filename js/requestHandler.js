var requestHandler = (function () {
    var isRequestInProgess;

    return {
        fetch: function (url, callback) {
            if (isRequestInProgess) { // A fetch is already in progress so skip this command
                return;
            }

            if (!url) { 
                return;
            }

            isRequestInProgess = true;

            $.ajax({
                url: url,
                dataType: 'jsonp',
                success: function (response) {
                    isRequestInProgess = false;
                    callback && callback(response);
                }
            });

	    return true;
        },
    };
}());
