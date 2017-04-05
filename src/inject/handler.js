//establishing the two way communication between inject.js & handler.
//handleMessage uses this reference.
var ref;

chrome.runtime.onConnect.addListener(function(port) {
    ref = port;
    port.onMessage.addListener(function(msg){
        //format id | time | usr | message
        //send over the data to the naclmodule, where we'll derive relevance/conclusions.
		common.naclModule.postMessage(msg['id']+'|'+msg['time']+'|'+msg['usr']+'|'+msg['curusr']+'|'+msg['data']);
    });
});

function moduleDidLoad() {
  // Once we load, hide the plugin. In this example, we don't display anything
  // in the plugin, so it is fine to hide it.
  common.hideModule();
  common.naclModule.postMessage(relevance_data0);
  common.naclModule.postMessage(relevance_data1);
  common.naclModule.postMessage(relevance_data2);
  common.naclModule.postMessage(relevance_data3);
  common.naclModule.postMessage(relevance_data4);
  common.naclModule.postMessage(relevance_data5);
  common.naclModule.postMessage(relevance_data6);
  common.naclModule.postMessage(relevance_data7);
  common.naclModule.postMessage(sentiment8);
  common.naclModule.postMessage(sentiment9);
  common.naclModule.postMessage(sentiment10);
  common.naclModule.postMessage(sentiment11);
  common.naclModule.postMessage(sentiment12);
  common.naclModule.postMessage(sentiment13);
  common.naclModule.postMessage(sentiment14);
  common.naclModule.postMessage(sentiment15);
}



//called by common.js when native client responds.
function handleMessage(message) {
    ref.postMessage(message.data);
}

