var matrix = function (width, height, cells) {
        return {
            getWidth: function () {
                return width;
            },
            getHeight: function () {
                return height;
            },
            cells: cells
        };
};
