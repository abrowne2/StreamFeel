/* Copyright (c) 2017 Adam Browne
 * Inject.js is the content script which analyzes twitch. */
//Chart visualization code is in another file due to it's "spammy" nature w/ dynamically created HTML elements and styles.

 chrome.runtime.onMessage.addListener(function(response) {
    if (response == "tf")
        toggleFilter();
    else if(response == "ss")
        showChart();
});

var port = chrome.runtime.connect({name: "handler"});

port.onMessage.addListener(function(message) {
	MessageHandler(message);
});

function isRealtime() {
	try {
		var current = document.getElementById("rltime").checked;
		real_time = (current == true? true: false);
	} catch(e) {
		real_time = true;
	}
}

function MessageHandler(message){
    var data = message.split("|"), user;
    var target_msg = document.getElementById(data[0]);
    try {
        user = data[2].toLowerCase();
    } catch (err) {}
    if(toggle_filter == false) {
	    try {
            if(data[4] == "1" || user == current_user)
                target_msg.setAttribute("style", "display:block;visibility:visible;");
            else
                target_msg.remove();
	    } catch (err) {}
        storeAnalyticsData(data);		    
    } else {
        target_msg.setAttribute("style", "display:block;visibility:visible;");		
        storeAnalyticsData(data);
        data[5] = "";
        need.push(data.join('|'));
    }
}

//complete this at a later date.
// function handleMentions(selTime) {

// }

function enqueueEmote(label, time) {
    if (!(time in analData == true)) 
        analData[time] = new StreamData();
    analData[time].storeRecord("." + label);
    analData[time].updateDataFreq("e");                    
}

function parseEmotes(message, time) {
    var emotes = message.getElementsByTagName("img");
    for (var i = 0; i < emotes.length; ++i) {
        var current_emote = emotes[i];
        var textRep = current_emote.getAttribute("alt");
        if (!(textRep in store_map) == true){
            let imgSrc = current_emote.getAttribute("src");
            var impat = new Image(), pat;
            impat.src = (imgSrc[0] != '/'? imgSrc: "https:" + imgSrc);
            var c = document.getElementById("painted");
            let context = c.getContext('2d');			
            impat.onload = function() {
            	store_map[textRep] = context.createPattern(impat,'repeat');
            }
        }
        enqueueEmote(textRep, time);
    }
}

function StreamData() {
    this.freq = {}, this.sent = [];
    this.cmd = [], this.emote = [];
    this.msgs = 0;
    this.storeRecord = function(label) {
        if (!(label in this.freq) == true)
            this.freq[label] = 1;
        else
            ++this.freq[label];
        ++this.msgs;
    }

    this.isSentType = function(key, parameter) {
        return parameter == "" && key[0] != "!" && key[0] != ".";
    }

    this.desiredKeys = function(type) {
        var parameter = type == "cmd" ? "!" :
            type == "e" ? "." : "";
        var output = [];
        for (var key in this.freq) {
			if (parameter == key[0])
				output.push(key);
			else if (this.isSentType(key, parameter) == true)
				output.push(key);
        }
        return output;
    }

    this.getTypeTotal = function(type_keys) {
        var total = 1;
		for (var key in type_keys)
			if (this.freq.hasOwnProperty(key)) 
				total += this.freq[key];
		return total;
    }

    this.updateDataFreq = function(type) {
        var type_keys = this.desiredKeys(type),
            totalFreq = this.getTypeTotal(type_keys);
        type == "cmd" ? this.cmd = [] : type == "e" ? this.emote = [] : this.sent = [];
        for (var key in type_keys) {
            var actual = type_keys[key];
            if (this.freq.hasOwnProperty(actual)) {
                var val = this.freq[actual];
                if (type == "cmd")
                    this.cmd.push({
                        label: actual,
                        value: (val / totalFreq)
                    });
                else if (type == "e") {
                    this.emote.push({
                    	label: actual.substr(1),
                    	value: (val / totalFreq)
                    });
                } else {
                    this.sent.push({
                        label: actual,
                        value: (val / totalFreq)
                    });
                }
            }
        }
    }
}

function handleRecord(data) {
    var cur_time = data[1], record;
    if (!(cur_time in analData) == true)
        analData[cur_time] = new StreamData();
    if (data[5] != "") { //sentiment analytics
        record = data[5];
        analData[cur_time].storeRecord(record);
        analData[cur_time].updateDataFreq(" ");
    }
    if(real_time == true){
		var slider = document.getElementById("seltime");    	
    	slider.value = slider.max;
    	try {
    		document.getElementById("rltime").checked = true;
    	} catch(e) {
    		console.log("some rendering error(?)");
    	}
    }
}


function handleSlider() {
	var slider = document.getElementById("seltime");
	let times = Object.keys(analData);
	slider.max = times.length - 1;
	selTime = times[slider.value];	
    modifyTags();
    let bColor = renderData(selTime);
    if(setting == 1){
        pie.data.datasets[0].backgroundColor = bColor;
        pie.options.title.text = "Emote Analytics";
        pie.options.tooltips.enabled = false;
        pie.reset();
    } else {
        pie.data.datasets[0].backgroundColor = ["#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F",
                "#B276B2","#DECF3F","#F15854","#2ECCC4"];
        pie.options.title.text = (setting == 0? "What are people feeling?": "Command Analytics");
        pie.options.tooltips.enabled = true;
    }
	pie.update();
}

function renderData(time){
    var lbls = [], dta = [], curData, bColor = [];
    curData = (setting == 0? analData[time].sent: setting == 1? analData[time].emote: analData[time].cmd);
    for(var index in curData){
        lbls.push(curData[index].label);
        dta.push(curData[index].value);
        if(setting == 1)
            bColor.push(store_map[curData[index].label]);
    }
    pie.data.labels = lbls;
    pie.data.datasets[0].data = dta;    
    return bColor;
}

function modifyTags() {
    try {
        var numCurMsg = analData[selTime].msgs.toString();	
    } catch(e) {
        var numCurMsg = "Loading";
    }
	document.getElementById("tim").src = timeimg;
	document.getElementById("curtim").innerHTML = selTime;
	document.getElementById("msgs").src = msgimg;
	document.getElementById("num").innerHTML = numCurMsg;	
}

function storeAnalyticsData(data) {
	isRealtime();
    handleRecord(data);
    checkDarkMode();
	handleSlider();    
}


var handleTwitchMsg = function(msg) {
    var go_on = false;
    try {
        var timestamp = msg.querySelector("span.timestamp").textContent
        var user = msg.querySelector("span.from").textContent
        var message = msg.querySelector("span.message")
        parseEmotes(message, timestamp);
        go_on = true;
    } catch(err) {
        go_on = false;
    }
    if(go_on == true) {
        if (message.hasAttribute("data-raw") == true) { //better twitch tv
            try {
                var raw_msg = decodeURIComponent(message.getAttribute("data-raw"));
                message = raw_msg.trim();
            } catch (err) {
                message = message.textContent.trim();
            }
        } else {
            message = message.textContent.trim();
        }
        port.postMessage({
            id: msg.id,
            time: timestamp,
            usr: user,
            curusr: current_user,
            data: message
        });
    }
}

var getChatBoxElement = function(main) {
    if (document.querySelector(main) != null) {
        setupMessageListener(document.querySelector(main));
        var sentChart = setupDataViz();
        if (sentChart != null) {
            setupChart(sentChart);
        }
        getCurUser();
    } else {
        setTimeout(function() {
            getChatBoxElement(main);
        }, 500);
    }
}

var setupMessageListener = function(chat_box) {
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            for (var i = 0; i < mutation.addedNodes.length; ++i) {
                var newTwitchMsg = mutation.addedNodes[i], identifier;
                var isValid = true;
                if (newTwitchMsg.id != "undefined" && newTwitchMsg.id != "") { //native twitch
                    identifier = newTwitchMsg.id;
                } else {
                    identifier = newTwitchMsg.getAttribute("data-id"); //better twitch tv
                    if (identifier == "undefined") { //an admin message.
                        newTwitchMsg.setAttribute("style", "display:block;visibility:visible;");
                    }
                    isValid = false;
                }
                if (handled.includes(identifier) == false) {
                    handled.push(identifier);
                    if (isValid == false) //better twitch tv compatibility
                        newTwitchMsg.setAttribute("id", identifier);
                    handleTwitchMsg(newTwitchMsg);
                }
            }
        })
    });
    //listen for new chat messages. We've incorporated BTTV compatibility.
    observer.observe(chat_box, {
        childList: true
    });
}

//if we're turning the filter back on, process all queued messages.
function toggleFilter() {
    toggle_filter = toggle_filter == false ? true : false;
    if (toggle_filter == false) {
        while (need.length > 0) {
            try {
                MessageHandler(need.shift());
            } catch (err) {}
        }
    }
}

function showChart() {
    toggle_chart = toggle_chart == false? true: false;
    var frame = document.getElementById("dataviz");    
    if(toggle_chart == true){
        frame.style.visibility = "hidden";
    } else {
        frame.style.visibility = "visible";
    }
}

function setupChart(construct) {
    pie = new Chart(construct, chartSettings());
}

function checkChangedStream(curStream) {
    if (curStream != oldStream) {
        oldStream = curStream;
        getChatBoxElement("ul.chat-lines");
    }
    oldStream = window.location.href;
    setTimeout(function() {
        checkChangedStream(window.location.href);
    }, 2000);
}
checkChangedStream();