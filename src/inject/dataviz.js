/* Author: Adam Browne, w/ lines 109-133: jnoreiga; stackoverflow(seebelow)
 * Dataviz.js sets up the data visualization (analytics), for 
 * commands, emojis, and sentiment. */

var styling = "position:absolute;top:50%;left:50%;margin-top:-250px;margin-left:-400px;width:450px;height:350px;z-index:9002; +\
				border-radius:3px;border: 1px solid #000;background-color:mintcream;cursor:pointer;";

var current_user = "";

function setupDataViz() {
	var frame = document.getElementById("dataviz");
	var sentiment = null;
	if(frame == "" || frame == "undefined" || frame == null){
		var structure = document.createElement("div");
		// structure.style.visibility = "hidden";
		structure.setAttribute("id","dataviz");
		structure.setAttribute("style", styling);
		sentiment = document.createElement("div");
		sentiment.setAttribute("id","sent");
		structure.appendChild(sentiment);
		var top = document.getElementsByTagName("body")[0];
		if(top) top.appendChild(structure);
		setupDrag();
	}
	return sentiment;
}

function getCurUser() {
	if(document.querySelector("div.js-chat-display") != null){
		var dis = document.querySelector("div.js-chat-display");
		dis = dis.getElementsByClassName("chat-menu-content")[1];
		current_user = dis.getElementsByClassName("strong")[0].textContent.toLowerCase();
	} else {
		setTimeout(function() {
			getCurUser();
		}, 250)
	}
}


function chartSettings() {
	return {
		"header": {
			"title": {
				"text": "What people are feeling / thinking",
				"fontSize": 20,
				"font": "verdana"
			},
			"subtitle": {
				"text": "General sentiment by the minute",
				"color": "#999999",
				"fontSize": 9,
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
			"canvasHeight": 300,
			"canvasWidth": 443,
			"pieOuterRadius": "100%"
		},
		"data": {
			"content": []
		},
		"labels": {
			"outer": {
				"pieDistance": 20
			},
			"inner": {
				"hideWhenLessThanPercentage": 5
			},
			"mainLabel": {
				"color": "#050506",
				"font": "verdana",
				"fontSize": 11
			},
			"percentage": {
				"color": "#ffffff",
				"font": "verdana",
				"fontSize": 10,
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
				"effect": "none"
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
					"#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F","#B276B2","#DECF3F","#F15854","#2ECCC4"
				]
			},
			"canvasPadding": {
				"top": 2, "right": 2, "bottom": 2, "left": 2
			}
		}
	};    
}

//Lines 109-133 credit jnoreiga; http://stackoverflow.com/questions/9334084/moveable-draggable-div
var x_pos = 0, y_pos = 0;
function setupDrag() {
  var sent = document.getElementById('dataviz');
  sent.addEventListener('mousedown', mouseDown, false);
  window.addEventListener('mouseup', mouseUp, false);
}

function mouseUp() {
  window.removeEventListener('mousemove', divMove, true);
}

function mouseDown(e) {
	var div = document.getElementById('dataviz');
	x_pos = e.clientX - div.offsetLeft;
	y_pos = e.clientY - div.offsetTop;
	window.addEventListener('mousemove', divMove, true);
}

function divMove(e) {
  var div = document.getElementById('dataviz');
  div.style.position = 'absolute';
  div.style.top = (e.clientY - y_pos + 250) + 'px'; //had to account for both offsets. (note by adam)
  div.style.left = (e.clientX - x_pos + 400) + 'px'; 
}
