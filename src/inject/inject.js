/* Copyright (c) 2017 Adam Browne
 * Inject.js is the content script which analyzes twitch. */

//NOTES to self: If no data for timestamp, don't render it.

	var toggle_filter = false, pie = null, curTimestamp, prevTime, setting = 0;
	var analData = {};
    //listener to the popup menu. We listen to it's instructions.
    chrome.runtime.onMessage.addListener(function(response){
        if(response == "tf")
            toggleFilter();
    });    

    var port = chrome.runtime.connect({name: "handler"});
    port.onMessage.addListener(function(message){
        var data = message.split("|"), user;
        var target_msg = document.getElementById(data[0]);
        try {
        	user = data[2].toLowerCase();
        } catch(err) { }
        if(data[4] == "1" || user == current_user) {
            try {
                target_msg.setAttribute("style", "display:block;visibility:visible;");
            } catch(err) {}
        } else {
            try {
                target_msg.setAttribute("style", "display:none;visibility:hidden;");
            } catch(err) {}
        }
        storeAnalyticsData(data);        
    });

    function storeAnalyticsData(data){
    	//sent, emoji, and commands storage
    	if(!(data[1] in analData) == true){
    		analData[data[1]] = [[],[],[],{}];
    	}
        if(data[5] != "") { //sentiment analytics
        	var sent = data[5]; 
        	if(!(sent in analData[data[1]][3]) == true) {
        		analData[data[1]][3][sent] = 1;
        	} else {
        		++analData[data[1]][3][sent];
        	}
        	updateDataFreq(0,data[1]);
        } else { //command analytics
        	//do nothing.
        }
        if(curTimestamp != data[1]) {
        	curTimestamp = data[1];
        }
		pie.updateProp("data.content",analData[curTimestamp][setting]);        
    }
	//it's guaranteed this won't be 0 at the end of this program,...
    function calcTotal(time){
    	var total = 1; 
		for(var key in analData[time][3]){
			if(analData[time][3].hasOwnProperty(key)){
				total += analData[time][3][key];
			}
		}
		return total;
    }

    function updateDataFreq(type,time){
    	//we don't need the previous contents, we have the frequencies.
		analData[time][type] = [];
		var totalFreq = calcTotal(time);
		for(var key in analData[time][3]){
			if(analData[time][3].hasOwnProperty(key)){
				var val = analData[time][3][key];
				analData[time][type].push({label: key, value: (val / totalFreq)});
			}
		}
	}


    var handleTwitchMsg = function(msg) {
        var timestamp = msg.querySelector("span.timestamp").textContent
        var user = msg.querySelector("span.from").textContent
        var message = msg.querySelector("span.message").textContent.trim()
        console.log(message)
        var identifier = msg.id;
        port.postMessage({id: identifier, time: timestamp, usr: user, curusr: current_user, data: message});
    }
    
    var getChatBoxElement = function(main) {
        if(document.querySelector(main) != null){
            setupMessageListener(document.querySelector(main));
            var sentChart = setupDataViz();
            if(sentChart != null){
            	setupChart(sentChart);
            }
            getCurUser();
		} else {
            setTimeout(function() {
                getChatBoxElement(main);
            }, 500);
        }
    }

    var need = [], handled = [];
	/* To observe the new messages, we need to use a MutationObserver
	* and then apply a queryselector to get the new message added:
	we're looking for: <li class="message-line chat-line ember-view"> */
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
	                        if(identifier == "undefined") { //an admin message.
	                        	newTwitchMsg.setAttribute("style", "display:block;visibility:visible;");
	                        }
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


    function setupChart(construct) {
    	pie = new d3pie(construct, chartSettings());
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
    
