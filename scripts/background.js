window.addEventListener('load', function() {
	opera.extension.onmessage = function(event) {
		var msg = event.data;
		var tab = event.source;

		var response = null;

		console.log(msg.type == null ? 'Unknown message' : msg.type +
			' received in background.js');

		switch (msg.type) {
			case 'tryEnable':
				Rikaisan.onTabSelect(tab);
				break;
			case 'xsearch':
				response = Rikaisan.search(msg.text, msg.showmode);
				break;
			case 'translate':
				response = Rikaisan.translate(msg.title);
				break;
			case 'makehtml':
				response = Rikaisan.makeHtml(msg.entry);
				break;
			default:
				console.log('Message not handled.');
				break;
		}

		if(response != null) {
			tab.postMessage(response);
		}
	};

	opera.extension.tabs.addEventListener('focus', function() {
		Rikaisan.onTabSelect(opera.extension.tabs.getFocused());
	}, false);
}, false);

