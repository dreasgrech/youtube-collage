var matrixCollection = function (box, postWidth, postHeight, postsPerRow) {
    var list = [],
        // holds the list of matrices
        getTotalHeight = function () {
            var i = 0,
                j = list.length,
                total = helpers.getElementAbsoluteY(box.find("canvas")[0]);
            for (; i < j; ++i) {
                total += list[i].getHeight();
            }

            return total;
        };
    return {
        push: function (m) {
            list.push(m);
        },
        elementAt: function (n) {
            return list[n];
        },
        modifyCells: function (n, newCells) {
            list[n].cells = newCells;
        },
        length: function () {
            return list.length;
        },
        getElementUnderMouse: function (clickX, clickY) {
            var m, i = 0,
                j = list.length,
                totalHeight = helpers.getElementAbsoluteY(box.find("canvas")[0]);
            for (; i < j; ++i) {
                if (totalHeight + list[i].getHeight() > clickY) {
                    m = list[i];
                    break;
                }

                totalHeight += list[i].getHeight();
            }
            if (!m) {
                return;
            }

            var yPosInM = clickY - totalHeight;
            var matrixCell = Math.ceil(clickX / postWidth) - 1;
            var matrixRow = Math.ceil(yPosInM / postHeight) - 1;

            return m.cells[(matrixRow * postsPerRow) + matrixCell];
        },
        getTotalHeight: getTotalHeight
    };
};
