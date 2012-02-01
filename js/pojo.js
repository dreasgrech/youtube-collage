/*
 * http://blog.dreasgrech.com/2012/02/creating-pojos-in-javascript.html
 */
var pojo = function () {
    var members = arguments;

    return function () {
        var obj = {}, i = 0, j = members.length;
        for (; i < j; ++i) {
            obj[members[i]] = arguments[i];
        }

        return obj;
    };
};
