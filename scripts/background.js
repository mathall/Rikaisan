window.addEventListener('load', function(){

	//
	// Set up message handler
	//

	function onMessage(event){
		var msg = event.data;
		var tab = event.source;
	
		switch(msg.type){
			case 'tryEnable':
				console.log('tryEnable');
				rcxMain.onTabSelect(tab);
				break;
			case 'xsearch':
				console.log('xsearch');
				var e = rcxMain.search(msg.text, msg.showmode);
				tab.postMessage(e);
				break;
			case 'translate':
				console.log('translate');
				var e = rcxMain.dict.translate(msg.title);
				tab.postMessage(e);
				break;
			case 'makehtml':
				console.log('makehtml');
				var html = rcxMain.dict.makeHtml(msg.entry);
				tab.postMessage(html);
				break;
			default:
				console.log(msg);
		}
	};

	opera.extension.onmessage = onMessage;

	//
	// Attach button to UI
	//

	var UIItemProperties = {
		disabled: true,
		title: "rikaisan",
		icon: "images/button.png",
		onclick: function(){ rcxMain.inlineToggle(opera.extension.tabs.getFocused()); }
	};

    var button = opera.contexts.toolbar.createItem(UIItemProperties);
    opera.contexts.toolbar.addItem(button);
    
	function enableButton(){
		var tab = opera.extension.tabs.getFocused();
		if (tab) {
			button.disabled = false;
		} else {
			button.disabled = true;
		}
	}
	
	opera.extension.onconnect = enableButton;
	opera.extension.tabs.onfocus = enableButton;
	opera.extension.tabs.onblur = enableButton;

	opera.extension.tabs.addEventListener('focus', function(){
		rcxMain.onTabSelect(opera.extension.tabs.getFocused());
	}, false);

	//
	// Set up Rikaisan instance
	//

	if(initStorage("v0.8.5", true)){
		initStorage("popupcolor", "blue");
		initStorage("highlight", "yes");
		initStorage("textboxhl", "no");
	}
	
	function initStorage(key, initialValue){ 
	  var currentValue = localStorage[key]; 
	  if (!currentValue) { 
		localStorage[key] = initialValue; 
		return true; 
	  } 
	  return false; 
	}
	
	rcxMain.config = {};
	rcxMain.config.css = localStorage["popupcolor"];
	rcxMain.config.highlight = localStorage["highlight"];
	rcxMain.config.textboxhl = localStorage["textboxhl"];;
}, false);

