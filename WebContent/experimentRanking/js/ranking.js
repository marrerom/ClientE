/**
 * 
 */

const USERCOOKIE = "user";

var linkcolor = null;
var host;

function init(){

	host = getHost();
	
	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "block";
	document.getElementById("resultblock").style.display = "none";
	
	document.getElementById("user").innerHTML = getCookie(USERCOOKIE);
	
	document.getElementById("docback").addEventListener("click", function(){
		document.getElementById("docblock").style.display = "none";
		document.getElementById("searchblock").style.display = "none";
		document.getElementById("resultblock").style.display = "block";
	}); 

	document.getElementById("resultback").addEventListener("click", function(){
		document.getElementById("docblock").style.display = "none";
		document.getElementById("searchblock").style.display = "block";
		document.getElementById("resultblock").style.display = "none";
	}); 
	
	getLinkColor();

}

function searchMainWindow(){
	var query = document.getElementById("searchinput").value;
	search(query);
}

function searchResultWindow(){
	var query = document.getElementById("resultsinput").value;
	search(query);
}

function getHost(){
	var result = window.location.protocol + "//" + window.location.hostname;
	var port = window.location.port;
	if (port != null && port != ""){
		result = result +":"+port;
	}
	var path = window.location.pathname;
	return result +path;
}

function createNextPages(query, hits){
	document.getElementById("pages").innerHTML="";
	for (var i=0;i<hits;i+=10){
		var link = document.createElement("A");
		link.setAttribute("href", "javascript:showPage('"+query+"',"+i+");");
		link.innerHTML = "&nbsp;&nbsp;";
		link.appendChild(document.createTextNode(i/10));
		link.innerHTML += "&nbsp;&nbsp;";
		document.getElementById("pages").appendChild(link);
	}
}


function loadResults(results, query, from){
	document.getElementById("hits").innerHTML = results.hits.total +" documents";
	document.getElementById("time").innerHTML = results.took +" ms.";
	document.getElementById("resultsinput").value = query;
	document.getElementById("resultslist").innerHTML="";
	for (var i = 0; i < results.hits.hits.length; i++) {
		  addResult(results.hits.hits[i],query, from+i+1); //ranking starting in 1
		}
}

function searchSuccess(results, query, from){
	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "block";
	//Note: If you want to open an existing URL and assign it to the current window, 
	//you would need to pass the results, query and linkcolor either via url params or window.localStorage
	//var newwin = window.open("results.html","_self"); 
	//if (newwin == null) return;
	//You can also "create" that new web page with newwin.document.write
	//newwin.document.write("<html>...</html>");

	var resultsObj = JSON.parse(results); 
	loadResults(resultsObj, query, from);
	createNextPages(query,resultsObj.hits.total);
}

function getSnippetField(field, fieldarray){
	var snippet = ""; 
	if (fieldarray){
		snippet = snippet +"<p><strong>"+field+": </strong>"
		for(var i = 0; i < fieldarray.length; i++) {
			snippet = snippet + "<span>"+fieldarray[i]+"</span>";
		}
		snippet = snippet +"</p>";
	}
	return snippet;
}

function getSnippet(item){
	var snippet = ""; 
	if (item.highlight.title != null)
		snippet = snippet + getSnippetField("title", item.highlight.title);
	if (item.highlight.author != null)
		snippet = snippet + getSnippetField("author", item.highlight.author);
	if (item.highlight.bibliography != null)
		snippet = snippet + getSnippetField("bibliography", item.highlight.bibliography);
	if (item.highlight.body != null)
		snippet = snippet + getSnippetField("body", item.highlight.body);
	return snippet;
}

function addResult(item, query, ranking){
	var title = item._source.title;
	var id = item._id;
	var snippet = getSnippet(item);
	
	var li = document.createElement("li");
	li.setAttribute("id", id);

	var titleElement = document.createElement("A");
	titleElement.setAttribute("href", "javascript:showDocument("+id+",'"+query+"',"+ranking+");");
	titleElement.setAttribute("style", "color:"+linkcolor+";");
	
	titleElement.appendChild(document.createTextNode(title));

	var snippetElement = document.createElement("P");            
	//snippetElement.appendChild(document.createTextNode(snippet));
	snippetElement.innerHTML =snippet;
	
	li.appendChild(titleElement);
	li.appendChild(snippetElement);
	document.getElementById("resultslist").appendChild(li);
}


function getLinkColorSuccess(color){
	linkcolor = color;
}


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "Not set";
}


function showDocumentSuccess(esdoc){
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "none";
	document.getElementById("docblock").style.display = "block";
	
	var obj = JSON.parse(esdoc);
	document.getElementById("doctitle").innerHTML = obj._source.title; 
	document.getElementById("docauthor").innerHTML = obj._source.author;
	document.getElementById("docbibliography").innerHTML = obj._source.bibliography;
	document.getElementById("docbody").innerHTML = obj._source.body;
}


/*
 * AJAX
 */

function getXMLHttpRequest(){
	if (window.XMLHttpRequest) {
		// code for modern browsers
		xmlhttp = new XMLHttpRequest();
	} else {
		// code for old IE browsers
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;
}

//TODO: search directly to elastic
function search(query) {
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			searchSuccess(this.responseText, query, 0);
	    }
	};
	var now = new Date();
	var timestamp = now.toISOString();
	xhttp.open("GET", host+"Search?query="+query+"&timestamp="+timestamp, true);
	xhttp.send();
}

//TODO: just return the color
function getLinkColor(){
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			getLinkColorSuccess(this.responseText);
	    }
	};
	var now = new Date();
	var timestamp = now.toISOString();
	xhttp.open("GET", host+"LinkColor?timestamp="+timestamp, true);
	//xhttp.open("GET", host+"LinkColor", true);
	xhttp.send();
}

function showDocument(id, query, ranking){
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			showDocumentSuccess(this.responseText);
	    }
	};
	var now = new Date();
	var timestamp = now.toISOString();
	xhttp.open("GET", host+"Document?docid="+id+"&docquery="+query+"&docranking="+ranking+"&timestamp="+timestamp, true);
	xhttp.send();
}

function showPage(query, from){
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			searchSuccess(this.responseText, query, from);
	    }
	};
	var now = new Date();
	var timestamp = now.toISOString();
	xhttp.open("GET", host+"Page?query="+query+"&from="+from+"&timestamp="+timestamp, true);
	xhttp.send();
}



