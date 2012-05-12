if (!document.caretPositionFromPoint) {
	document.caretPositionFromPoint = function(x, y) {
		function isInRect(x, y, rect) {
			return x >= rect.left && x <= rect.right &&
				y >= rect.top && y <= rect.bottom;
		}

		var range = document.createRange();
		var elem = document.elementFromPoint(x, y);

		var nodes = elem.childNodes.length > 0 ? elem.childNodes : [elem];

		for (var n in nodes) {
			var node = nodes[n];

			for (var i = 0; i < node.length; i++) {
				range.setStart(node, i);
				range.setEnd(node, i+1);
				var rect = range.getBoundingClientRect();

				if (isInRect(x, y, rect)) {
					range.setEnd(node, i);
					return range;
				}
			}
		}

		return range;
	}
}

