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
  common.naclModule.postMessage(trainRelevance());
}

//called by common.js when native client responds.
function handleMessage(message) {
    ref.postMessage(message.data);
}

function trainRelevance() {
	return ["0"].concat(relevance_data);
}

function trainSentiment() {
	return sentiment;
}