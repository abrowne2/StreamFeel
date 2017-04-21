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
  //we've chunked both datasets into 16 parts to speed up construction
  common.hideModule();
  common.naclModule.postMessage(relevance_data0);
  common.naclModule.postMessage(relevance_data1);
  common.naclModule.postMessage(relevance_data2);
  common.naclModule.postMessage(relevance_data3);
  common.naclModule.postMessage(relevance_data4);
  common.naclModule.postMessage(relevance_data5);
  common.naclModule.postMessage(relevance_data6);
  common.naclModule.postMessage(relevance_data7);
  common.naclModule.postMessage(relevance_data8);
  common.naclModule.postMessage(relevance_data9);
  common.naclModule.postMessage(relevance_data10);
  common.naclModule.postMessage(relevance_data11);
  common.naclModule.postMessage(relevance_data12);
  common.naclModule.postMessage(relevance_data13);
  common.naclModule.postMessage(relevance_data14);
  common.naclModule.postMessage(relevance_data15);
  //begin the sentiment dataset chunking for this portion of the code 
  common.naclModule.postMessage(sentiment16);
  common.naclModule.postMessage(sentiment17);
  common.naclModule.postMessage(sentiment18);
  common.naclModule.postMessage(sentiment19);
  common.naclModule.postMessage(sentiment20);
  common.naclModule.postMessage(sentiment21);
  common.naclModule.postMessage(sentiment22);
  common.naclModule.postMessage(sentiment23);
  common.naclModule.postMessage(sentiment24);
  common.naclModule.postMessage(sentiment25);
  common.naclModule.postMessage(sentiment26);
  common.naclModule.postMessage(sentiment27);
  common.naclModule.postMessage(sentiment28);
  common.naclModule.postMessage(sentiment29);
  common.naclModule.postMessage(sentiment30);
  common.naclModule.postMessage(sentiment31);

}



//called by common.js when native client responds.
function handleMessage(message) {
    ref.postMessage(message.data);
}

