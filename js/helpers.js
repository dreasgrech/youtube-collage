var helpers = (function () {
    return {
        getElementAbsoluteY: function (el) {
            var y = 0;
            while (el != null) {
                y += el.offsetTop;
                el = el.offsetParent;
            }

            return y;
        },
        createCanvas: function (width, height) {
            var canvas = document.createElement('canvas');
            canvas.className += "canvas";
            canvas.width = width;
            canvas.height = height;

            return canvas;
        }
    };
}());
