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
  common.naclModule.postMessage(trainClassifier());
}

//called by common.js when native client responds.
function handleMessage(message) {
    console.log(message.data)
    ref.postMessage(message.data);
}

function trainClassifier() {
    return relevance_data;
}