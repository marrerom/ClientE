/**
 * 
 */

const USERCOOKIE = "user";
const EXPDAYS = 60;

var idexperiment;
var user;

function init(idexp){
	idexperiment = idexp;
	user = getCookie(USERCOOKIE);
	if (!user)
		loadTreatmentNoUser();
	else 
		loadTreatmentUser();
}

function loadTreatmentNoUser() {
	var xhttp = createCORSRequest("POST", "http://localhost:8080/IREPlatform/service/experiment/getparams/"+idexperiment);
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				var responseObj = JSON.parse(this.responseText);
				user = responseObj._idunit;
				setCookie(USERCOOKIE,user,EXPDAYS);
				window.location.replace(responseObj._url);
			} else {
				window.location.replace("/experimentColor/linkcolorBlue.html"); //Default interface if we can't set user id. Events won't be registered
			}
		}
	};
	//only with POST instead of GET, all the options work as expected (eg. highlight)
	xhttp.setRequestHeader("Accept", "application/json");
	xhttp.send();
}

function loadTreatmentUser() {
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				var responseObj = JSON.parse(this.responseText);
				window.location.replace(responseObj._url);
			} else {
				user=null; //so no events are registered
				window.location.replace("/experimentColor/linkcolorBlue.html"); //Default interface if we can't set user id. Events won't be registered
			}
		}
	};
	//only with POST instead of GET, all the options work as expected (eg. highlight)
	xhttp.open("POST", "http://localhost:8080/IREPlatform/service/experiment/getparams/"+idexperiment+"/"+user, true);
	xhttp.setRequestHeader("Accept", "application/json");
	xhttp.send();
}


//GENERIC

function getHost() {
	var result = window.location.protocol + "//" + window.location.hostname;
	var port = window.location.port;
	if (port != null && port != "") {
		result = result + ":" + port;
	}
	var path = window.location.pathname;
	return result + path;
}

function createCORSRequest(method, url){
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr){
    // XHR has 'withCredentials' property only if it supports CORS
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined"){ // if IE use XDR
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
}

function getXMLHttpRequest() {
	if (window.XMLHttpRequest) {
		// code for modern browsers
		xmlhttp = new XMLHttpRequest();
	} else {
		// code for old IE browsers
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;
}

// COOKIES


function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return null;
}
