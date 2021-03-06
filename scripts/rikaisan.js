﻿/*

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
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files. - Jon

*/

var Rikaisan = new function() {
	var ShowMode = {
		WORDS	:0,
		KANJI	:1,
		NAMES	:2,
		COUNT	:2, // names search is not really supported yet
	};

	var _enabled = false;
	var _dict = null;

	var _miniHelp = (
		'<span style="font-weight:bold">Rikaisan enabled!</span><br><br>' +
		'<table cellspacing=5>' +
		'<tr><td>A</td><td>Alternate popup location</td></tr>' +
		'<tr><td>Y</td><td>Move popup location down</td></tr>' +
		'<tr><td>Shift/Enter&nbsp;&nbsp;</td>' +
			'<td>Switch dictionaries</td></tr>' +
		'<tr><td>B</td><td>Previous character</td></tr>' +
		'<tr><td>M</td><td>Next character</td></tr>' +
		'<tr><td>N</td><td>Next word</td></tr>' +
		'</table>'
	);

	function _loadDictionary() {
		if (!_dict) {
			try {
				_dict = new rcxDict(false);
			}
			catch (e) {
				opera.postError('Error loading dictionary: ' + e);
			}
		}
		return _dict != null;
	};

	function _inlineEnable(tab, mode) {
		if (!_dict && !_loadDictionary()) {
			return;
		}

		if (tab) {
			_enabled = true;

			var tabEnabled = _tryEnableTab(tab);

			if (tabEnabled && mode == ShowMode.KANJI) {
				tab.postMessage({type:'showPopup', text:_miniHelp});
			}
		}

		Button.setEnabled();
	};

	function _inlineDisable(tab) {
		delete _dict;

		_enabled = false;

		Button.setDisabled();

		opera.extension.broadcastMessage({type:'disable'});
	};

	function _tryEnableTab(tab) {
		var success = true;

		if (_enabled) {
			try {
				tab.postMessage({type:'enable', config:{
					css: widget.preferences['popupcolor'],
					highlight: widget.preferences['highlight'],
					textboxhl: widget.preferences['textboxhl']
				}});
			}
			catch (e) {
				success = false;
			}
		}

		return success;
	};

	function _inlineToggle(tab) {
		if (_enabled) {
			_inlineDisable(tab);
		}
		else {
			_inlineEnable(tab, ShowMode.KANJI);
		}
	};

	function _search(text, showMode) {
		var m = showMode;
		var entry = null;

		do {
			switch (showMode) {
				case ShowMode.WORDS:
					entry = _dict.wordSearch(text, false);
					break;
				case ShowMode.KANJI:
					entry = _dict.kanjiSearch(text.charAt(0));
					break;
				case ShowMode.NAMES:
					entry = _dict.wordSearch(text, true);
					break;
			}
			if (entry) {
				break;
			}
			showMode = (showMode + 1) % ShowMode.COUNT;
		} while (showMode != m);

		return entry;
	};

	function _translate(title) {
		return _dict ? _dict.translate(title) : null;
	};

	function _makeHtml(entry) {
		return _dict ? _dict.makeHtml(entry) : null;
	};

	var _this = {
		onTabSelect: function(tab) { _tryEnableTab(tab); },
		inlineToggle: function(tab) { _inlineToggle(tab); },
		search: function(text, showMode) { return _search(text, showMode); },
		translate: function(title) { return _translate(title); },
		makeHtml: function(entry) { return _makeHtml(entry); }
	};

	return _this;
};

