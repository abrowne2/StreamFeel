//establishing the two way communication between inject.js & handler.
//handleMessage uses this reference.
var ref;

chrome.runtime.onConnect.addListener(function(port) {
    ref = port;
    port.onMessage.addListener(function(msg){
        //format id | time | usr | message
        //send over the data to the naclmodule, where we'll derive relevance/conclusions.
		common.naclModule.postMessage(msg['id']+'|'+msg['time']+'|'+msg['usr']+'|'+msg['data']);
    });
});

function moduleDidLoad() {
  // Once we load, hide the plugin. In this example, we don't display anything
  // in the plugin, so it is fine to hide it.
  common.hideModule();
  //post both datasets to the module to build the categorizers.
  common.naclModule.postMessage([9,"blah78e"]);
  common.naclModule.postMessage(trainRelevance());
  common.naclModule.postMessage(firstSentChunk());
}



//called by common.js when native client responds.
function handleMessage(message) {
    if(message.data == "f") //native client wants second chunk now.
    	common.naclModule.postMessage(secoSentChunk());
    ref.postMessage(message.data);
}

function trainRelevance() {
	return relevance_data;
}

function firstSentChunk() {
	return sentiment;
}

function secoSentChunk() {
	return sentiment2;
}