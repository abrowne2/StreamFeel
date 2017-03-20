/* Copyright (c) 2017 Adam Browne
 * Inject.js is the content script which analyzes twitch. */

/* To observe the new messages, we need to use a MutationObserver
* and then apply a queryselector to get the new message added:
we're looking for: <li class="message-line chat-line ember-view"> */
	var toggle_filter = false;
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
            } catch(err){

            }
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
                        } catch(err) { }
                    }
                }
            })
        });
        //listen for new chat messages. We've incorporated BTTV compatibility.
        observer.observe(chat_box, {childList: true});
    }

    function toggleFilter() {
    	toggle_filter = toggle_filter == false? true: false;
        if(toggle_filter == false){
            while(need.length > 0){
                try {
                    handleTwitchMsg(document.getElementById(need.shift()));
                } catch(err){

                }
            }
        }
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
//         pie = new d3pie(element, {
//             header: {
//                 title: {
//                     text: "A very simple example pie"
//                 }
//             },
//             data: {
//                 content: [
//                     { label: "JavaScript", value: 264131 },
//                     { label: "Ruby", value: 218812 },
//                     { label: "Java", value: 157618},
//                 ]
//             }
//         });
//         tester = true;
//         pie.redraw();
//     }
// });

