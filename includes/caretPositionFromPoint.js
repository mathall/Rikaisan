/*
 * See for further detail: http://stackoverflow.com/a/9603270/1130005
 */

if (!document.caretPositionFromPoint) {
	document.caretPositionFromPoint = function(x, y) {
		function isInRect(x, y, rect) {
			return x >= rect.left && x <= rect.right &&
				y >= rect.top && y <= rect.bottom;
		}

		var range = document.createRange();
		var elem = document.elementFromPoint(x, y);

		var nodes = elem.childNodes.length > 0 ? elem.childNodes : [elem];

		var lastRect = null;
		var possiblyRight = null;

		for (var n in nodes) {
			var node = nodes[n];

			// skip non-textnodes
			if (node.nodeType != 3) {
				continue;
			}

			var lastRect = {left:0,right:0,top:0,bottom:0};

			// check point against individual character's bounding boxes
			for (var i = 0; i < node.length; i++) {
				range.setStart(node, i);
				range.setEnd(node, i+1);
				var rect = range.getBoundingClientRect();

				// fixes issues with newline
				var lastWidth = lastRect.right - lastRect.left;
				lastRect = rect;
				var possiblyWrong = lastWidth > 0 &&
					(rect.right - rect.left) > lastWidth * 2;

				// if cursor is on the currect character
				if (isInRect(x, y, rect)) {
					// Remember first range which is possibly right..
					// and possibly wrong..
					// yuuup
					if (possiblyWrong) {
						if (!possiblyRight) {
							possiblyRight = document.createRange();
							possiblyRight.setStart(node, i);
							possiblyRight.setEnd(node, i);
						}
					}
					else {
						range.setEnd(node, i);
						return range;
					}
				}
			}
		}

		// I suppose this is probably what we were looking for
		if (possiblyRight) {
			range = possiblyRight;
		}

		return range;
	}
}

