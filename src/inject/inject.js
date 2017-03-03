//this script should communicate with our native client.

/* To observe the new messages, we need to use a MutationObserver
* and then apply a queryselector to get the new message added:
we're looking for: <li class="message-line chat-line ember-view"> */
    var port = chrome.runtime.connect({name: "handler"});
    port.onMessage.addListener(function(message){
        console.log(message);
    });

    var streamfeel_user = document.querySelector(".js-chat-display").querySelector(".chat-menu-content").querySelector(".ember-view").querySelector(".strong").textContent;

    console.log(streamfeel_user)
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
            for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
                listener = listeners[i];
                // Query for elements matching the specified selector
                elements = doc.querySelectorAll(listener.selector);
                for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
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

    //we have access to the element here.
    ready('li.message-line.chat-line.ember-view', function(element) {
        var timestamp = element.querySelector("span.timestamp.float-left").textContent
        var user = element.querySelector("span.from").textContent
        var message = element.querySelector("span.message").textContent.trim()
        var identifier = element.id
        port.postMessage({id: identifier, time: timestamp, usr: user, data: message});
    });


