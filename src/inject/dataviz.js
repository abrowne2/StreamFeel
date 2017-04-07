/* Author: Adam Browne, w/ lines 109-133: jnoreiga; stackoverflow(seebelow)
 * Dataviz.js sets up the data visualization (analytics), for 
 * commands, emojis, and sentiment. */

var styling = "position:absolute;top:50%;left:50%;margin-top:-250px;margin-left:-400px;width:425px;height:250px;z-index:9002; +\
				border-radius:3px;border: 1px solid #000;background-color:mintcream;cursor:pointer;";

var current_user = "";

function setupDataViz() {
	var frame = document.getElementById("dataviz");
	var sentiment = null;
	if(frame == "" || frame == "undefined" || frame == null){
		var structure = document.createElement("div");
		structure.setAttribute("id","dataviz");
		structure.setAttribute("style", styling);
		sentiment = document.createElement("canvas");
		sentiment.setAttribute("id","sent");
		sentiment.width = 310;
		sentiment.height = 155;
		structure.appendChild(sentiment);
		var top = document.getElementsByTagName("body")[0];
		if(top) top.appendChild(structure);
		setupDrag();
		document.getElementById("dataviz").style.visibility = "hidden";
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
	// // var newc = document.createElement("canvas");
	// // drawer = newc.getContext("2d");
	// // var img = new Image();
	// // img.src = "https://static-cdn.jtvnw.net/emoticons/v1/2/1.0";
	// img.onload = function() {
	// 	var pattern = drawer.createPattern(img, 'repeat');
	// }		
	return {
		type: "pie",
		data: {
			labels: [],
			datasets: [{
				data: [],
				backgroundColor: ["#5DA5DA","#FAA43A","#60BD68","#F17CB0","#B2912F",
				"#B276B2","#DECF3F","#F15854","#2ECCC4"],
				borderWidth: 0
			}]
		},
		options: {
			title: {
				display: true,
				text: "What are people thinking or feeling?"
			},
			legend: {
				position: "right",
				labels: {
					boxWidth: 20,
					padding: 5
				}
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
