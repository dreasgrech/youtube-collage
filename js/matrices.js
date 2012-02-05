var matrixCollection = function (box, postWidth, postHeight, postsPerRow) {
    var list = [], // holds the list of matrices
        getTotalHeight = function () {
            var i = 0,
                j = list.length,
                total = helpers.getElementAbsoluteY(box.find("canvas")[0]);
            for (; i < j; ++i) {
                total += list[i].getHeight();
            }

            return total;
        },
	expandIndex = function (index) {
		return {
			matrixIndex : index >> 8,
			elementIndex : index & 0xFF
		};
	},
	generateIndex = function (matrixIndex, elementIndex) {
	    return (matrixIndex << 8) + elementIndex;
	},
	applyIndexes = function (matrixIndex) {
		var theMatrix = list[matrixIndex], i = 0, j = theMatrix.cells.length;
		for (; i < j; ++i) {
			theMatrix.cells[i].index = generateIndex(matrixIndex, i);
		}
	},
	getElementFromIndex = function (index) {
		var expandedIndex = expandIndex(index), thisMatrix = list[expandedIndex.matrixIndex];
		if (!thisMatrix) {
			return;
		}

		return thisMatrix.cells[expandedIndex.elementIndex];
	};

    return {
        push: function (m) {
            list.push(m);
	    applyIndexes(list.length - 1);
        },
        elementAt: function (n) {
            return list[n];
        },
        modifyCells: function (n, newCells) {
            list[n].cells = newCells;
	    applyIndexes(n);
        },
        length: function () {
            return list.length;
        },
	getPreviousElement: function (index) {
		var expandedIndex = expandIndex(index),
		    matrixIndex = expandedIndex.matrixIndex,
		    elementIndex = expandedIndex.elementIndex;

		if (!elementIndex) { // the first element in the matrix
			matrixIndex--;
			elementIndex = list[matrixIndex].cells.length - 1;
		} else {
			elementIndex--;
		}

		return getElementFromIndex(generateIndex(matrixIndex, elementIndex));
        },
	getNextElement: function (index) {
		var expandedIndex = expandIndex(index),
		    matrixIndex = expandedIndex.matrixIndex,
		    elementIndex = expandedIndex.elementIndex;

		if (elementIndex === list[matrixIndex].cells.length - 1) { // the last element in the matrix
			matrixIndex++;
			elementIndex = 0;
		} else {
			elementIndex++;
		}

		return getElementFromIndex(generateIndex(matrixIndex, elementIndex));
	},
        getElementUnderMouse: function (clickX, clickY) {
            var m, i = 0,
                j = list.length,
                totalHeight = helpers.getElementAbsoluteY(box.find("canvas")[0]); // start accumulating from the absolute position of where the first canvas is.
            for (; i < j; ++i) {
                if (totalHeight + list[i].getHeight() > clickY) {
                    m = list[i];
                    break;
                }

                totalHeight += list[i].getHeight();
            }
            if (!m) { // no matrix found in the given coordinates
                return;
            }

            var yPosInM = clickY - totalHeight,
		matrixCell = Math.ceil(clickX / postWidth) - 1,
		matrixRow = Math.ceil(yPosInM / postHeight) - 1,
		elementIndex = (matrixRow * postsPerRow) + matrixCell,
		elementUnderCoordinates = m.cells[elementIndex];

	    if (!elementUnderCoordinates) { // no element found in the this matrix for the given coordinates
		    return;
	    }

	    //elementUnderCoordinates.index = generateIndex(i, elementIndex);
            return elementUnderCoordinates;
        },
        getTotalHeight: getTotalHeight
    };
};
