/*

	Rikaisan
	Copyright (C) 2012 Mathias Hällman

	---

	Originally based on Rikaikun 0.8.5
	by Erek Speed
	http://code.google.com/p/rikaikun/

	---

	Originally based on Rikaichan 1.07
	by Jonathan Zarate
	http://www.polarcloud.com/

	---

	Originally based on RikaiXUL 0.4 by Todd Rudick
	http://www.rikai.com/
	http://rikaixul.mozdev.org/

	---

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with _program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files. - Jon

*/

var RsContent = new function() {
	var ShowMode = {
		WORDS	:0,
		KANJI	:1,
		NAMES	:2,
		COUNT	:3,
	};

	var _showMode = ShowMode.KANJI;
	var _altView = 0;
	var _lastFound = null;

	var _keysDown = [];
	var _mDown = false;

	var _inlineNames = {
		// text node
		'#text': true,

		// font style
		'FONT': true,
		'TT': true,
		'I' : true,
		'B' : true,
		'BIG' : true,
		'SMALL' : true,
		//deprecated
		'STRIKE': true,
		'S': true,
		'U': true,

		// phrase
		'EM': true,
		'STRONG': true,
		'DFN': true,
		'CODE': true,
		'SAMP': true,
		'KBD': true,
		'VAR': true,
		'CITE': true,
		'ABBR': true,
		'ACRONYM': true,

		// special, not included IMG, OBJECT, BR, SCRIPT, MAP, BDO
		'A': true,
		'Q': true,
		'SUB': true,
		'SUP': true,
		'SPAN': true,
		'WBR': true,

		// ruby
		'RUBY': true,
		'RBC': true,
		'RTC': true,
		'RB': true,
		'RT': true,
		'RP': true
	};

	// Hack because SelEnd can't be sent in messages
	var _lastSelEnd = [];
	// Hack because ro was coming out always 0 for some reason.
	var _lastRo = 0;

	function _enableTab(config) {
		if (!window.rikaisan) {
			window.rikaisan = {'config':config};
			window.addEventListener('keydown', _onKeyDown, true);
			window.addEventListener('keyup', _onKeyUp, true);
			window.addEventListener('mousedown', _onMouseDown, false);
			window.addEventListener('mouseup', _onMouseUp, false);
			window.addEventListener('mousemove', _onMouseMove, false);
		}
	};

	function _disableTab() {
		if (window.rikaisan) {
			window.removeEventListener('keydown', _onKeyDown, true);
			window.removeEventListener('keyup', _onKeyUp, true);
			window.removeEventListener('mosuedown', _onMouseDown, false);
			window.removeEventListener('mouseup', _onMouseUp, false);
			window.removeEventListener('mousemove', _onMouseMove, false);

			var elem = null;

			if (elem = document.getElementById('rikaisan-css')) {
				elem.parentNode.removeChild(e);
			}

			if (elem = document.getElementById('rikaisan-window')) {
				elem.parentNode.removeChild(e);
			}

			_clearHi();

			delete window.rikaisan;
		}
	};

	function _getContentType(tDoc) {
		var meta = tDoc.getElementsByTagName('meta');

		for (var m in meta) {
			if (meta[m].httpEquiv == 'Content-Type') {
				var con = meta[m].content;
				con = con.split(';');
				return con[0];
			}
		}

		return null;
	};

	function _receiveCSS(css) {
		var cssElem = document.getElementById('rikaisan-css');
		if (cssElem) {
			cssElem.textContent = css;
		}
	};

	function _showPopup(text, elem, x, y, looseWidth) {
		topdoc = window.document;

		var elemNS = 'http://www.w3.org/1999/xhtml';

		if ((isNaN(x)) || (isNaN(y))) {
			x = y = 0;
		}

		var popup = topdoc.getElementById('rikaisan-window');
		if (!popup) {
			// create and attach style element
			var cssElem = topdoc.createElementNS(elemNS, 'style');
			cssElem.setAttribute('type', 'text/css');
			cssElem.setAttribute('id', 'rikaisan-css');
			topdoc.getElementsByTagName('head')[0].appendChild(cssElem);

			// get css content
			var cssDoc = 'css/popup-' + window.rikaisan.config.css + '.css';
			opera.extension.postMessage({type:'requestCSS', doc:cssDoc});

			// create and attach popup div
			popup = topdoc.createElementNS(elemNS, 'div');
			popup.setAttribute('id', 'rikaisan-window');
			topdoc.getElementsByTagName('body')[0].appendChild(popup);

			popup.addEventListener('dblclick', function(event) {
				_hidePopup();
				event.stopPropagation();
			}, true);
		}

		popup.style.width = 'auto';
		popup.style.height = 'auto';
		popup.style.maxWidth = looseWidth ? '' : '600px';

		if (_getContentType(topdoc) == 'text/plain') {
			var docFrag = document.createDocumentFragment();
			docFrag.appendChild(document.createElementNS(elemNS, 'span'));
			docFrag.firstChild.innerHTML = text;

			while (popup.firstChild) {
				popup.removeChild(popup.firstChild);
			}

			popup.appendChild(docFrag.firstChild);
		}
		else {
			popup.innerHTML = text;
		}

		if (elem) {
			popup.style.top = '-1000px';
			popup.style.left = '0px';
			popup.style.display = '';

			var pW = popup.offsetWidth;
			var pH = popup.offsetHeight;

			// guess!
			if (pW <= 0) {
				pW = 200;
			}
			if (pH <= 0) {
				pH = 0;
				var j = 0;
				while ((j = text.indexOf('<br/>', j)) != -1) {
					j += 5;
					pH += 22;
				}
				pH += 25;
			}

			if (_altView == 1) {
				x = window.scrollX;
				y = window.scrollY;
			}
			else if (_altView == 2) {
				x = (window.innerWidth - (pW + 20)) + window.scrollX;
				y = (window.innerHeight - (pH + 20)) + window.scrollY;
			}

			// This probably doesn't actually work
			else if (elem instanceof window.HTMLOptionElement) {
				// these things are always on z-top, so go sideways

				x = 0;
				y = 0;

				var p = elem;
				while (p) {
					x += p.offsetLeft;
					y += p.offsetTop;
					p = p.offsetParent;
				}

				if (elem.offsetTop > elem.parentNode.clientHeight) {
					y -= elem.offsetTop;
				}

				if ((x + popup.offsetWidth) > window.innerWidth) {
					// too much to the right, go left
					x -= popup.offsetWidth + 5;
					if (x < 0) {
						x = 0;
					}
				}
				else {
					// use SELECT's width
					x += elem.parentNode.offsetWidth + 5;
				}
			}
			else {
				// go left if necessary
				if ((x + pW) > (window.innerWidth - 20)) {
					x = (window.innerWidth - pW) - 20;
					if (x < 0) {
						x = 0;
					}
				}

				// below the mouse
				var v = 25;

				// under the popup title
				if ((elem.title) && (elem.title != '')) {
					v += 20;
				}

				// go up if necessary
				if ((y + v + pH) > window.innerHeight) {
					var t = y - pH - 30;
					if (t >= 0) {
						y = t;
					}
				}
				else {
					y += v;
				}

				x += window.scrollX;
				y += window.scrollY;
			}
		}
		else {
			x += window.scrollX;
			y += window.scrollY;
		}

		popup.style.left = x + 'px';
		popup.style.top = y + 'px';
		popup.style.display = '';
	};

	function _hidePopup() {
		var popup = document.getElementById('rikaisan-window');
		if (popup) {
			popup.style.display = 'none';
			popup.innerHTML = '';
		}
	};

	function _isVisible() {
		var popup = document.getElementById('rikaisan-window');
		return popup && popup.style.display != 'none';
	};

	function _clearHi() {
		var tdata = window.rikaisan;

		if (!tdata || !tdata.prevSelView) {
			return;
		}

		if (tdata.prevSelView.closed) {
			tdata.prevSelView = null;
			return;
		}

		var sel = tdata.prevSelView.getSelection();

		// If there is an empty selection or the selection was done by rikaisan
		// then we'll clear it.
		if ((!sel.toString()) || (tdata.selText == sel.toString())) {
			// In the case of no selection we clear the oldTA
			// The reason for this is becasue if there's no selection we
			// probably clicked somewhere else and we don't want to bounce
			// back.
			if (!sel.toString()) {
				tdata.oldTA = null;
			}

			// clear all selections
			sel.removeAllRanges();

			// Text area stuff If oldTA is still around that means we had a
			// highlighted region which we just cleared and now we're going to
			// jump back to where we were the cursor was before our lookup if
			// oldCaret is less than 0 it means we clicked outside the box and
			// shouldn't come back.
			if (tdata.oldTA && tdata.oldCaret >= 0) {
				tdata.oldTA.selectionStart = tdata.oldCaret;
				tdata.oldTA.selectionEnd = tdata.oldCaret;
			}
		}

		tdata.prevSelView = null;
		tdata.kanjiChar = null;
		tdata.selText = null;
	};

	function _isInline(node) {
		var computedStyle = document.defaultView.getComputedStyle(node, null);
		var display = computedStyle.getPropertyValue('display');

		return _inlineNames.hasOwnProperty(node.nodeName) ||
			display == 'inline' ||
			display == 'inline-block';
	};

	// Gets text from a node
	// returns a string
	// node: a node
	// selEnd: the selection end object will be changed as a side effect
	// maxLength: the maximum length of returned string
	// xpathExpr: an XPath expression, which evaluates to text nodes, will be
	// evaluated relative to "node" argument
	function _getInlineText(node, selEndList, maxLength, xpathExpr) {
		var text = '';
		var endIndex;

		if (node.nodeName == '#text') {
			endIndex = Math.min(maxLength, node.data.length);
			selEndList.push({node: node, offset: endIndex});
			return node.data.substring(0, endIndex);
		}

		var result = xpathExpr.evaluate(node,
			window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

		while (text.length < maxLength && node = result.iterateNext()) {
			endIndex = Math.min(node.data.length, maxLength - text.length);
			text += node.data.substring(0, endIndex);
			selEndList.push({node: node, offset: endIndex});
		}

		return text;
	};

	// given a node which must not be null,
	// returns either the next sibling or next sibling of the father or
	// next sibling of the fathers father and so on or null
	function _getNext(node) {
		var nextNode = null;

		if (node.nextSibling) {
			nextNode = node.nextSibling;
		}
		else if (node.parentNode && _isInline(node.parentNode)) {
			nextNode = _getNext(node.parentNode);
		}

		return nextNode;
	};

	function _getTextFromRange(rangeParent, offset, selEndList, maxLength) {
		// XPath expression which evaluates to text nodes tells rikaisan which
		// text to translate expression to get all text nodes that are not in
		// (RP or RT) elements.
		var textNodeExpr = 'descendant-or-self::text()[not(parent::rp)' +
			' and not(ancestor::rt)]';

		// XPath expression which evaluates to a boolean. If it evaluates to
		// true then rikaisan will not start looking for text in this text node
		// ignore text in RT elements.
		var startElementExpr = 'boolean(parent::rp or ancestor::rt)';

		var parentName = rangeParent.NodeName;
		if (parentName == 'TEXTAREA' || parentName == 'INPUT') {
			var endIdx = Math.min(rangeParent.data.length, offset + maxLength);
			return rangeParent.value.substring(offset, endIdx);
		}

		var text = '';

		var endIdx;

		var xpathExpr = rangeParent.ownerDocument.createExpression(
			textNodeExpr, null);

		if (rangeParent.ownerDocument.evaluate(startElementExpr, rangeParent,
			null, window.XPathResult.BOOLEAN_TYPE, null).booleanValue) {
			return '';
		}

		if (rangeParent.nodeType != window.Node.TEXT_NODE) {
			return '';
		}

		endIdx = Math.min(rangeParent.data.length, offset + maxLength);
		text += rangeParent.data.substring(offset, endIdx);
		selEndList.push({node: rangeParent, offset: endIdx});

		var nextNode = rangeParent;
		while (((nextNode = _getNext(nextNode)) != null) &&
			(_isInline(nextNode)) && (text.length < maxLength)) {
			text += _getInlineText(nextNode, selEndList,
				maxLength - text.length, xpathExpr);
		}

		return text;
	};

	function _show(tdata) {
		var rp = tdata.prevRangeNode;
		var ro = tdata.prevRangeOfs + tdata.uofs;
		var u;

		tdata.uofsNext = 1;

		if (!rp) {
			_clearHi();
			_hidePopup();
			return 0;
		}

		if ((ro < 0) || (ro >= rp.data.length)) {
			_clearHi();
			_hidePopup();
			return 0;
		}

		// if we have 'XYZ', where whitespace is compressed, X never seems to
		// get selected.
		while (((u = rp.data.charCodeAt(ro)) == 32) || (u == 9) || (u == 10)) {
			++ro;
			if (ro >= rp.data.length) {
				_clearHi();
				_hidePopup();
				return 0;
			}
		}

		//
		if ((isNaN(u)) ||
			((u != 0x25CB) &&
			((u < 0x3001) || (u > 0x30FF)) &&
			((u < 0x3400) || (u > 0x9FFF)) &&
			((u < 0xF900) || (u > 0xFAFF)) &&
			((u < 0xFF10) || (u > 0xFF9D)))) {
			_clearHi();
			_hidePopup();
			return -2;
		}

		//selection end data
		var selEndList = [];
		var text = _getTextFromRange(rp, ro, selEndList, 13);

		lastSelEnd = selEndList;
		lastRo = ro;
		opera.extension.postMessage({type:'xsearch',
			'text':text, 'showmode':_showMode});

		return 1;
	};

	function _processEntry(e) {
		tdata = window.rikaisan;
		ro = lastRo;
		selEndList = lastSelEnd;

		if (!e) {
			_hidePopup();
			_clearHi();
			return -1;
		}
		_lastFound = [e];

		if (!e.matchLen) {
			e.matchLen = 1;
		}
		tdata.uofsNext = e.matchLen;
		tdata.uofs = (ro - tdata.prevRangeOfs);

		rp = tdata.prevRangeNode;
		// don't try to highlight form elements
		if ((rp) &&
			((tdata.config.highlight=='yes' && !_mDown &&
				!('form' in tdata.prevTarget)) ||
			(('form' in tdata.prevTarget)
				&& tdata.config.textboxhl == 'yes'))) {
			var doc = rp.ownerDocument;
			if (!doc) {
				_clearHi();
				_hidePopup();
				return 0;
			}
			_highlightMatch(doc, rp, ro, e.matchLen, selEndList, tdata);
			tdata.prevSelView = doc.defaultView;
		}

		opera.extension.postMessage({"type":"makehtml", "entry":e});
	};

	function _processHtml(html) {
		tdata = window.rikaisan;
		_showPopup(html, tdata.prevTarget, tdata.popX, tdata.popY, false);
		return 1;
	};

	function _highlightMatch(doc, rp, ro, matchLen, selEndList, tdata) {
		var sel = doc.defaultView.getSelection();

		// If selEndList is empty then we're dealing with a textarea/input
		// situation.
		if (selEndList.length === 0) {
			try {
				if (rp.nodeName == 'TEXTAREA' || rp.nodeName == 'INPUT') {
					// If there is already a selected region not caused by
					// rikaisan, leave it alone
					if ((sel.toString()) && (tdata.selText != sel.toString())) {
						return;
					}

					// If there is no selected region and the saved
					// textbox is the same as teh current one
					// then save the current cursor position
					// The second half of the condition let's us place the
					// cursor in another text box without having it jump back
					if (!sel.toString() && tdata.oldTA == rp) {
						tdata.oldCaret = rp.selectionStart;
						tdata.oldTA = rp;
					}
					rp.selectionStart = ro;
					rp.selectionEnd = matchLen + ro;

					tdata.selText = rp.value.substring(ro, matchLen+ro);
				}
			}
			catch(err) {
				// If there is an error it is probably caused by the input type
				// being not text.  This is the most general way to deal with
				// arbitrary types.

				// we set oldTA to null because we don't want to do weird stuf
				// with buttons
				tdata.oldTA = null;
				//console.log("invalid input type for selection:" + rp.type);
				console.log(err.message);
			}
			return;
		}

		// Special case for leaving a text box to an outside japanese
		// Even if we're not currently in a text area we should save
		// the last one we were in.
		if (tdata.oldTA && !sel.toString() && tdata.oldCaret >= 0) {
			tdata.oldCaret = tdata.oldTA.selectionStart
		}

		var selEnd;
		var offset = matchLen + ro;

		for (var i = 0, len = selEndList.length; i < len; i++) {
			selEnd = selEndList[i]
			if (offset <= selEnd.offset) {
				break;
			}
			offset -= selEnd.offset;
		}

		var range = doc.createRange();
		range.setStart(rp, ro);
		range.setEnd(selEnd.node, offset);

		if ((sel.toString()) && (tdata.selText != sel.toString())) {
			return;
		}
		sel.removeAllRanges();
		sel.addRange(range);
		tdata.selText = sel.toString();
	};

	function _showTitle(tdata) {
		opera.extension.postMessage({"type":"translate", "title":tdata.title});
	};

	function _processTitle(e) {
		tdata = window.rikaisan;

		if (!e) {
			_hidePopup();
			return;
		}

		e.title = tdata.title.substr(0, e.textLen).replace(/[\x00-\xff]/g,
			function (c) { return '&#' + c.charCodeAt(0) + ';' });

		if (tdata.title.length > e.textLen) {
			e.title += '...';
		}

		_lastFound = [e];

		opera.extension.postMessage({"type":"makehtml", "entry":e});
	};

	function _getFirstTextChild(node) {
		return document.evaluate('descendant::text()[not(parent::rp)' +
			' and not(ancestor::rt)]', node, null,
			window.XPathResult.ANY_TYPE, null).iterateNext();
	};

	function _makeFake(real) {
		var fake = document.createElement('div');
		fake.innerText = real.value;
		fake.style.cssText =
			document.defaultView.getComputedStyle(real, "").cssText;
		fake.scrollTop = real.scrollTop;
		fake.scrollLeft = real.scrollLeft;
		fake.style.position = "absolute";
		fake.style.zIndex = 7777;
		$(fake).offset(
			{top: $(real).offset().top, left:$(real).offset().left});

		return fake;
	};

	function _getTotalOffset(parent, tNode, offset) {
		var fChild = parent.firstChild;
		var realO = offset;
		if (fChild == tNode) {
			return offset;
		}
		do {
			var val = 0;
			if (fChild.nodeName == "BR") {
				val = 1;
			}
			else {
				val = (fChild.data ? fChild.data.length : 0)
			}
			realO += val;
		}
		while ((fChild = fChild.nextSibling) != tNode);

		return realO;
	};

	function _onKeyDown(ev) {
		if (((ev.altKey) || (ev.metaKey) || (ev.ctrlKey)) ||
			((ev.shiftKey) && (ev.keyCode != 16)) ||
			(_keysDown[ev.keyCode]) ||
			(!_isVisible())) {
			return;
		}

		var i;

		switch (ev.keyCode) {
			case 16:	// shift
			case 13:	// enter
				_showMode = (_showMode + 1) % ShowMode.COUNT;
				_show(ev.currentTarget.rikaisan);
				break;
			case 27:	// esc
				_hidePopup();
				_clearHi();
				break;
			case 65:	// a
				_altView = (_altView + 1) % 3;
				_show(ev.currentTarget.rikaisan);
				break;
			case 67:	// c
				_copyToClip();
				break;
			case 66:	// b
				var ofs = ev.currentTarget.rikaisan.uofs;
				for (i = 50; i > 0; --i) {
					ev.currentTarget.rikaisan.uofs = --ofs;
					_showMode = ShowMode.WORDS;
					if (_show(ev.currentTarget.rikaisan) >= 0) {
						if (ofs >= ev.currentTarget.rikaisan.uofs) {
							break;	// ! change later
						}
					}
				}
				break;
			case 77:	// m
				ev.currentTarget.rikaisan.uofsNext = 1;
			case 78:	// n
				for (i = 50; i > 0; --i) {
					ev.currentTarget.rikaisan.uofs +=
						ev.currentTarget.rikaichan.uofsNext;
					_showMode = ShowMode.WORDS;
					if (_show(ev.currentTarget.rikaisan) >= 0) {
						break;
					}
				}
				break;
			case 89:	// y
				_altView = 0;
				ev.currentTarget.rikaisan.popY += 20;
				_show(ev.currentTarget.rikaisan);
				break;
			default:
				return;
		}

		_keysDown[ev.keyCode] = 1;

		// don't eat shift if in this mode
		if (true/*!_cfg.nopopkeys*/) {
			ev.preventDefault();
		}
	};

	function _onKeyUp(ev) {
		if (_keysDown[ev.keyCode]) {
			_keysDown[ev.keyCode] = 0;
		}
	};

	function _onMouseDown(ev) {
		if (ev.button != 0) {
			return;
		}
		if (_isVisible()) {
			_clearHi();
		}
		mDown = true;

		// If we click outside of a text box then we set
		// oldCaret to -1 as an indicator not to restore position
		// Otherwise, we switch our saved textarea to whereever
		// we just clicked
		if (!('form' in ev.target)) {
			window.rikaisan.oldCaret =  -1;
		}
		else {
			window.rikaisan.oldTA = ev.target;
		}
	};

	function _onMouseUp(ev) {
		if (ev.button != 0) {
			return;
		}
		mDown = false;
	};

	function _onMouseMove(ev) {
		var fake;

		// Put this in a try catch so that an exception here doesn't prevent
		// editing due to div.
		try {
			var targetName = ev.target.nodeName;
			if (targetName == 'TEXTAREA' || targetName == 'INPUT') {
				fake = _makeFake(ev.target);
				document.body.appendChild(fake);
				fake.scrollTop = ev.target.scrollTop;
				fake.scrollLeft = ev.target.scrollLeft;
			}

			var tdata = window.rikaisan; // per-tab data

			var range = document.caretPositionFromPoint(ev.clientX, ev.clientY);
			var rp = range.startContainer;
			var ro = range.startOffset;

			if (fake) {
				// At the end of a line, don't do anything or you just get
				// beginning of next line.
				if ((rp.data) && rp.data.length == ro) {
					document.body.removeChild(fake);
					return;
				}
				fake.style.display = "none";
				ro = _getTotalOffset(rp.parentNode, rp, ro);
			}

			if (tdata.timer) {
				clearTimeout(tdata.timer);
				tdata.timer = null;
			}

			// This is to account for bugs in caretRangeFromPoint
			// It includes the fact that it returns text nodes over non text
			// nodes and also the fact that it miss the first character of
			// inline nodes.

			// If the range offset is equal to the node data length
			// Then we have the second case and need to correct.
			if ((rp.data) && ro == rp.data.length) {
				// A special exception is the WBR tag which is inline but
				// doesn't contain text.
				if ((rp.nextSibling) && (rp.nextSibling.nodeName == 'WBR')) {
					rp = rp.nextSibling.nextSibling;
					ro = 0;
				}
				// If we're to the right of an inline character we can use the
				// target.
				// However, if we're just in a blank spot don't do anything.
				else if (_isInline(ev.target)) {
						if (rp.parentNode == ev.target) {
							;
						}
						else if (fake &&
							rp.parentNode.innerText == ev.target.value) {
							;
						}
						else {
							rp = ev.target.firstChild;
							ro = 0;
						}
				}
				// Otherwise we're on the right and can take the next sibling of
				// the inline element.
				else {
					rp = rp.parentNode.nextSibling
					ro = 0;
				}
			}
			// The case where the before div is empty so the false spot is in
			// the parent.
			// But we should be able to take the target.
			// The 1 seems random but it actually represents the preceding empty
			// tag also we don't want it to mess up with our fake div.
			// Also, form elements don't seem to fall into _case either.
			if (!(fake) && !('form' in ev.target) && rp &&
				rp.parentNode != ev.target && ro == 1) {
				rp = _getFirstTextChild(ev.target);
				ro=0;
			}

			// Otherwise, we're off in nowhere land and we should go home.
			// offset should be 0 or max in _case.
			else if (!(fake) && (!(rp) || ((rp.parentNode != ev.target)))){
				rp = null;
				ro = -1;
			}

			// For text nodes do special stuff
			// we make rp the text area and keep the offset the same
			// we give the text area data so it can act normal
			if (fake) {
				rp = ev.target;
				rp.data = rp.value
			}

			if (ev.target == tdata.prevTarget && _isVisible()) {
				if (tdata.title) {
					if (fake) {
						document.body.removeChild(fake);
					}
					return;
				}
				if ((rp == tdata.prevRangeNode) && (ro == tdata.prevRangeOfs)) {
					if (fake) {
						document.body.removeChild(fake);
					}
					return;
				}
			}

			if (fake) {
				document.body.removeChild(fake);
			}
		}
		catch (err) {
			console.log(err.message);
			if (fake) {
				document.body.removeChild(fake);
			}
			return;
		}

		tdata.prevTarget = ev.target;
		tdata.prevRangeNode = rp;
		tdata.prevRangeOfs = ro;
		tdata.title = null;
		tdata.uofs = 0;
		_uofsNext = 1;

		if ((rp) && (rp.data) && (ro < rp.data.length)) {
			_showMode = ev.shiftKey ? ShowMode.KANJI : ShowMode.WORDS;
			tdata.popX = ev.clientX;
			tdata.popY = ev.clientY;
			tdata.timer = setTimeout(function() {
				_show(tdata);
			}, 1/*_cfg.popdelay*/);
			return;
		}

		if (true /*_cfg.title*/) {
			if ((typeof(ev.target.title) == 'string') &&
				(ev.target.title.length)) {
				tdata.title = ev.target.title;
			}
			else if ((typeof(ev.target.alt) == 'string') &&
				(ev.target.alt.length)) {
				tdata.title = ev.target.alt;
			}
		}

		// FF3
		if (ev.target.nodeName == 'OPTION') {
			tdata.title = ev.target.text;
		}
		else if (ev.target.nodeName == 'SELECT') {
			tdata.title = ev.target.options[ev.target.selectedIndex].text;
		}

		if (tdata.title) {
			tdata.popX = ev.clientX;
			tdata.popY = ev.clientY;
			tdata.timer = setTimeout(function(tdata) {
				_showTitle(tdata);
			}, 1/*_cfg.popdelay*/, tdata);
		}
		else {
			// dont close just because we moved from a valid popup slightly over
			// to a place with nothing.
			var dx = tdata.popX - ev.clientX;
			var dy = tdata.popY - ev.clientY;
			var distance = Math.sqrt(dx * dx + dy * dy);
			if (distance > 4) {
				_clearHi();
				_hidePopup();
			}
		}
	};

	var _this = {
		enableTab: function(config) { _enableTab(config); },
		disableTab: function() { _disableTab(); },
		showPopup: function(text) { _showPopup(text); },
		receiveCSS: function(css) { _receiveCSS(css); },
		processEntry: function(entry) { _processEntry(entry); },
		processHtml: function(html) { _processHtml(html); },
		processTitle: function(title) { _processTitle(title); },
	};

	return _this;
};

window.addEventListener('DOMContentLoaded', function() {
	opera.extension.onmessage = function(event) {
		var msg = event.data;

		console.log(msg.type ? msg.type : 'Unknown message' +
			' received in rikaicontent.js');

		switch(msg.type) {
			case 'enable':
				RsContent.enableTab(msg.config);
				break;
			case 'disable':
				RsContent.disableTab();
				break;
			case 'showPopup':
				RsContent.showPopup(msg.text);
				break;
			case 'receiveCSS':
				RsContent.receiveCSS(msg.css);
				break;
			case 'processEntry':
				RsContent.processEntry(msg.entry);
				break;
			case 'processHtml':
				RsContent.processHtml(msg.html);
				break;
			case 'processTitle':
				RsContent.processTitle(msg.title);
				break;
			default:
				console.log('Message not handled.');
				break;
		}
	};

	opera.extension.postMessage({type:'tryEnable'});
}, false);

