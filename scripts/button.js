var Button = new function() {
	var State = {
		ENABLED		:0,
		DISABLED	:1
	};

	var _UIItemProperties = {
		title: 'Rikaisan',
		icon: 'images/button.png',
		onclick: function() {
			Rikaisan.inlineToggle(opera.extension.tabs.getFocused());
		},
		badge: {
			display: 'block'
		}
	};

	var _button = opera.contexts.toolbar.createItem(_UIItemProperties);

	opera.contexts.toolbar.addItem(_button);;

	_setState(State.DISABLED);

	function _tryActivate() {
		_button.disabled = opera.extension.tabs.getFocused() == null;
	}

	opera.extension.onconnect = _tryActivate
	opera.extension.tabs.onfocus = _tryActivate;
	opera.extension.tabs.onblur = _tryActivate;

	function _setState(state) {
		switch (state) {
		case State.ENABLED:
			_button.badge.textContent = 'On';
			_button.badge.backgroundColor = 'rgba(255,0,0,255)';
			break;
		case State.DISABLED:
			_button.badge.textContent = '';
			_button.badge.backgroundColor = 'rgba(0,0,0,0)';
			break;
		}
	}

	return {
		setEnabled: function() { _setState(State.ENABLED); },
		setDisabled: function() { _setState(State.DISABLED); }
	};
};

