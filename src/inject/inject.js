/* Copyright (c) 2017 Adam Browne
 * Inject.js is the content script which analyzes twitch. */

/* To observe the new messages, we need to use a MutationObserver
* and then apply a queryselector to get the new message added:
we're looking for: <li class="message-line chat-line ember-view"> */
    var port = chrome.runtime.connect({name: "handler"});
    port.onMessage.addListener(function(message){
        var data = message.split("|");
        var target_msg = document.getElementById(data[0]);
        if(data[3] == "1") {//TODO: Non-relevant display CONFIGURE BY POPup
            try {
                target_msg.setAttribute("style", "display:block;visibility:visible;");
            } catch(err){

            }
        }
    });

    //need to fix this first.
    var streamfeel_user = document.getElementsByClassName(".chat-menu-content");
    // .children[0].children[1].innerText;
    // streamfeel_user = streamfeel_user.querySelector(".chat-menu-content")
    // .querySelector("div.ember-view").querySelector("span.strong").textContent;

    var handleTwitchMsg = function(msg) {
        var timestamp = msg.querySelector("span.timestamp").textContent
        var user = msg.querySelector("span.from").textContent
        var message = msg.querySelector("span.message").textContent.trim()
        var identifier = msg.id;
        port.postMessage({id: identifier, time: timestamp, usr: user, data: message});
    }

    var getChatBoxElement = function() {
        if(document.querySelector("ul.chat-lines") != null){
            setupMessageListener(document.querySelector("ul.chat-lines"));
        } else {
            setTimeout(function() {
                getChatBoxElement();
            }, 500);
        }
    }

    var handled = [];
    /* to setup the message listener, we have to first get the "ul.chat-lines" element.
     * this is added dynamically, so we'll use a mutation observer to get it, disconnect that observer,
     * and then begin listening to chat messages. */
    var setupMessageListener = function(chat_box) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                for(var i = 0; i < mutation.addedNodes.length; ++i){
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
                }
            })
        });
        //listen for new chat messages. We've incorporated BTTV compatibility.
        observer.observe(chat_box, {childList: true});
    }

    var oldStream = "";
    var curStream = window.location.href;
    function checkChangedStream(curStream){
        if(curStream != oldStream){
            oldStream = curStream;
            getChatBoxElement();
        }
        oldStream = window.location.href;
        setTimeout(function() {
            checkChangedStream(window.location.href);
        }, 2000);
    }

    checkChangedStream();

    // var setupDataInterface = function(node){
    //     ready(node, function(element) {
    //         var build = element.querySelector("div.chat-menu-content");
    //         var button = document.createElement("a");
    //         var img = document.createElement("img");
    //         img.src = chrome.runtime.getURL("dataico.png");
    //         var label = document.createTextNode(" StreamFeel Analytics");
    //         button.appendChild(img);
    //         button.appendChild(label);
    //         build.appendChild(button);
    //     });
    // }

    // setupDataInterface("div.js-chat-settings");
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

