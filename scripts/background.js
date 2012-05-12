window.addEventListener('load', function() {
	opera.extension.onmessage = function(event) {
		var msg = event.data;
		var tab = event.source;

		var response = null;

		console.log(msg.type ? msg.type : 'Unknown message' +
			' received in background.js');

		switch (msg.type) {
			case 'tryEnable':
				Rikaisan.onTabSelect(tab);
				break;
			case 'xsearch':
				response = {
					type:'processEntry',
					entry:Rikaisan.search(msg.text, msg.showmode)
				};
				break;
			case 'translate':
				response = {
					type:'processTitle',
					title:Rikaisan.translate(msg.title)
				};
				break;
			case 'makehtml':
				response = {
					type:'processHtml',
					html:Rikaisan.makeHtml(msg.entry)
				};
				break;
			case 'requestCSS':
				doXHR(msg.doc, function(data) {
					tab.postMessage({type:'receiveCSS', css:data});
				});
				break;
			default:
				console.log('Message not handled.');
				break;
		}

		if(response) {
			tab.postMessage(response);
		}
	};

	opera.extension.tabs.addEventListener('focus', function() {
		Rikaisan.onTabSelect(opera.extension.tabs.getFocused());
	}, false);
}, false);

function doXHR(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.responseText) {
				callback(xhr.responseText);
			}
			else {
				opera.postError('Error reading ' + url);
			}
		}
	};

	xhr.send();
}

