/* Copyright (c) 2017 Adam Browne
 * Inject.js is the content script which analyzes twitch. */

/* To observe the new messages, we need to use a MutationObserver
* and then apply a queryselector to get the new message added:
we're looking for: <li class="message-line chat-line ember-view"> */
	var toggle_filter = false, pie = null;
	var sentData = [
	  { label: "1", value: 6 },
	  { label: "2", value: 4 },
	  { label: "3", value: 3 },
	  {label:"4",value:2},
	  {label:"5",value:1},
	  {label:"6",value:5},
	  {label:"7",value:7},
	  {label:"8",value:3},
	  {label:"9",value:9}
	];
    //listener to the popup menu. We listen to it's instructions.
    chrome.runtime.onMessage.addListener(function(response){
        if(response == "tf")
            toggleFilter();
    });    

    var port = chrome.runtime.connect({name: "handler"});
    port.onMessage.addListener(function(message){
        var data = message.split("|");
        var target_msg = document.getElementById(data[0]);
        if(data[3] == "1") {//TODO: Non-relevant display CONFIGURE BY POPup
            try {
                target_msg.setAttribute("style", "display:block;visibility:visible;");
            } catch(err) {}
        } else {
            try {
                target_msg.setAttribute("style", "display:none;visibility:hidden;");
            } catch(err) {}
        }
    });

    var handleTwitchMsg = function(msg) {
        var timestamp = msg.querySelector("span.timestamp").textContent
        var user = msg.querySelector("span.from").textContent
        var message = msg.querySelector("span.message").textContent.trim()
        var identifier = msg.id;
        port.postMessage({id: identifier, time: timestamp, usr: user, data: message});
    }

    var getChatBoxElement = function(main) {
        if(document.querySelector(main) != null){
            setupMessageListener(document.querySelector(main));
            var sentChart = setupDataViz();
            if(sentChart != null){
            	setupChart(sentChart);
            }            
        } else {
            setTimeout(function() {
                getChatBoxElement(main);
            }, 500);
        }
    }

    var need = []; 
    var handled = [];
    /* to setup the message listener, we have to first get the "ul.chat-lines" element.
     * this is added dynamically, so we'll use a mutation observer to get it, disconnect that observer,
     * and then begin listening to chat messages. */
    var setupMessageListener = function(chat_box) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                for(var i = 0; i < mutation.addedNodes.length; ++i){
                	if(toggle_filter == false) {
	                    var newTwitchMsg = mutation.addedNodes[i], identifier;
	                    var isValid = true;
	                    if(newTwitchMsg.id != "undefined" && newTwitchMsg.id != ""){ //native twitch
	                        identifier = newTwitchMsg.id;
	                    } else {
	                        identifier = newTwitchMsg.getAttribute("data-id"); //better twitch tv
	                        isValid = false;
	                    }                
	                    if(handled.includes(identifier) == false){
	                        handled.push(identifier);
	                        if(isValid == false) //better twitch tv compatibility
	                            newTwitchMsg.setAttribute("id", identifier);
	                        handleTwitchMsg(newTwitchMsg);
	                    }
	                } else {
                        try {
                            var curMsg = mutation.addedNodes[i];
                            curMsg.setAttribute("style", "display:block;visibility:visible;");
                            if(curMsg.id == "" || curMsg.id == "undefined")
                                curMsg.setAttribute("id", curMsg.getAttribute("data-id"));
                            need.push(curMsg.id);
                        } catch(err) {}
                    }
                }
            })
        });
        //listen for new chat messages. We've incorporated BTTV compatibility.
        observer.observe(chat_box, {childList: true});
    }

    //if we're turning the filter back on, process all queued messages.
    function toggleFilter() {
    	toggle_filter = toggle_filter == false? true: false;
        if(toggle_filter == false){
            while(need.length > 0){
                try {
                    handleTwitchMsg(document.getElementById(need.shift()));
                } catch(err){}
            }
        }
    }

    function setupDataViz() {
    	var frame = document.getElementById("dataviz");
    	var sentiment = null;
    	if(frame == "" || frame == "undefined" || frame == null){
    		var structure = document.createElement("div");
    		// structure.style.visibility = "hidden";
    		structure.setAttribute("id","dataviz");
    		var styling = "position:absolute;top:50%;left:50%;margin-top:-250px;margin-left:-400px;width:800px;height:500px;z-index:9002;border-radius:3px;border: 1px solid #000;";
    		structure.setAttribute("style", styling);
			sentiment = document.createElement("div");
			sentiment.setAttribute("id","sent");
    		structure.appendChild(sentiment);
    		var top = document.getElementsByTagName("body")[0];
    		if(top) top.appendChild(structure);
    	}
    	return sentiment;
    }

    function setupChart(construct) {
        // document.getElementById("dataviz").style.visibility = "visible";
        // var construct = document.getElementById("sent");
		pie = new d3pie(construct, {
			"header": {
				"title": {
					"text": "What people are feeling",
					"fontSize": 22,
					"font": "verdana"
				},
				"subtitle": {
					"text": "General sentiment by the minute",
					"color": "#999999",
					"fontSize": 10,
					"font": "verdana"
				},
				"titleSubtitlePadding": 12
			},
			"footer": {
				"text": "generated using ",
				"color": "#999999",
				"fontSize": 11,
				"font": "open sans",
				"location": "bottom-center"
			},
			"size": {
				"canvasHeight": 400,
				"canvasWidth": 590,
				"pieOuterRadius": "96%"
			},
			"data": {
				"content": sentData
			},
			"labels": {
				"mainLabel": {
					"color": "#050506",
					"font": "verdana",
					"fontSize": 11
				},
				"percentage": {
					"color": "#ffffff",
					"font": "verdana",
					"fontSize": 11,
					"decimalPlaces": 0
				},
				"value": {
					"color": "#e1e1e1",
					"font": "verdana"
				},
				"lines": {
					"enabled": true,
					"color": "#cccccc"
				},
				"truncation": {
					"enabled": true
				}
			},
			"effects": {
				"load": {
					"speed": 450
				},
				"pullOutSegmentOnClick": {
					"effect": "linear",
					"speed": 400,
					"size": 8
				}
			},
			"misc": {
				"colors": {
					"segmentStroke": "",
					segments: [
						"#4D4D4D","#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854"
					]
				},
				"canvasPadding": {
					"top": 2,
					"right": 2,
					"bottom": 2,
					"left": 2
				}
			}
		});        // pie.redraw();
    }

    var oldStream = "";
    var curStream = window.location.href;
    function checkChangedStream(curStream){
        if(curStream != oldStream){
            oldStream = curStream;
            getChatBoxElement("ul.chat-lines");

        }
        oldStream = window.location.href;
        setTimeout(function() {
            checkChangedStream(window.location.href);
        }, 2000);
    }

    checkChangedStream();

// var tester = false, pie;
// ready("div.mg-b-2", function(element){
//     if(tester == false){
//     }
// });

