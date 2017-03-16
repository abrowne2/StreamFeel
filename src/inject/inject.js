// array used to store handled messages and msg_node for better ttv compatibility.
var handled = [];

/* To observe the new messages, we need to use a MutationObserver
* and then apply a queryselector to get the new message added:
we're looking for: <li class="message-line chat-line ember-view"> */
    var port = chrome.runtime.connect({name: "handler"});
    port.onMessage.addListener(function(message){
        var data = message.split("|");
        var target_msg = document.getElementById(data[0]);
        if(data[3] == "0") {//TODO: Non-relevant display CONFIGURE BY POPup
            try {
                target_msg.setAttribute("hidden", true);
            } 
            catch(err){
                //do nothing.
            }
        }
    });

    //need to fix this first.
    var streamfeel_user = document.getElementsByClassName(".chat-menu-content");
    // .children[0].children[1].innerText;
    // streamfeel_user = streamfeel_user.querySelector(".chat-menu-content")
    // .querySelector("div.ember-view").querySelector("span.strong").textContent;

    console.log(streamfeel_user);


    //below is some mutation observer hack to listen for dom element updates:
    //credit Ryan Morr @ http://ryanmorr.com/using-mutation-observers-to-watch-for-element-availability/
     (function(win) {
        'use strict';
        
        var listeners = [], 
        doc = win.document, 
        MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
        observer;
        
        function ready(selector, fn) {
            // Store the selector and callback to be monitored
            listeners.push({
                selector: selector,
                fn: fn
            });
            if (!observer) {
                // Watch for changes in the document
                observer = new MutationObserver(check);
                observer.observe(doc.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
            // Check if the element is currently in the DOM
            check();
        }
            
        function check() {
            // Check the DOM for elements matching a stored selector
            for (var i = 0, len = listeners.length, listener, elements; i < len; ++i) {
                listener = listeners[i];
                // Query for elements matching the specified selector
                elements = doc.querySelectorAll(listener.selector);
                for (var j = 0, jLen = elements.length, element; j < jLen; ++j) {
                    element = elements[j];
                    // Make sure the callback isn't invoked with the 
                    // same element more than once
                    if (!element.ready) {
                        element.ready = true;
                        // Invoke the callback with the element
                        listener.fn.call(element, element);
                    }
                }
            }
        }

        // Expose `ready`
        win.ready = ready;
                
    })(this);

//1 Get js-chat-settings element.
//2 Get child chat-menu-content
//3 create paragraph tag element
//4 append child to chat-menu-content
//profit
    var setupDataInterface = function(node){
        ready(node, function(element) {
            var build = element.querySelector("div.chat-menu-content");
            var button = document.createElement("a");
            var img = document.createElement("img");
            img.src = chrome.runtime.getURL("dataico.png");
            var label = document.createTextNode(" StreamFeel Analytics");
            button.appendChild(img);
            button.appendChild(label);
            build.appendChild(button);
        });
    }

    setupDataInterface("div.js-chat-settings");

    var observeMessages = function(node) {
        //we have access to the element here.
        ready(node, function(element) {
            //better twitch tv compatibility.
            try {
                var timestamp = element.querySelector("span.timestamp").textContent
                var user = element.querySelector("span.from").textContent
                var message = element.querySelector("span.message").textContent.trim()
                var identifier = node != "div.chat-line"? element.id: element.getAttribute("data-id");
                // re-handle guard w/ better ttv compatibility.
                if(handled.includes(identifier) == false) {
                    handled.push(identifier);
                    if(node == "div.chat-line")
                        element.setAttribute("id", identifier);
                    port.postMessage({id: identifier, time: timestamp, usr: user, data: message});
                }
            } catch(err) {
                //do nothing.
            }
        });
    }

    //better twitch tv compatibility. we can afford two listeners.
    observeMessages("div.chat-line");
    observeMessages("li.message-line.chat-line.ember-view");
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

