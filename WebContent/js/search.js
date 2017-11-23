/**
 * IMPORTANT: if you run this web project and elasticSearch in local, add this to elasticsearch.yml in config: 
 * http.cors.enabled: true
 * http.cors.allow-origin: /https?:\/\/localhost(:[0-9]+)?/
 */

const IDEXPERIMENT = "5a1549322ada011db14638d6";
const ELASTIC_URI = "http://ireplatform.ewi.tudelft.nl:9200";
const ELASTIC_DOCTYPE = "cran";
const IREPLATFORM_URI = "http://localhost:8080";

const NRESULTS = 10;
const EXPDAYS = 60;

//parameters
var user;
var index;
var color;

function init() {
	setParameters(IDEXPERIMENT);

	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "block";
	document.getElementById("resultblock").style.display = "none";

	document.getElementById("docback").addEventListener("click", function() {
		document.getElementById("docblock").style.display = "none";
		document.getElementById("searchblock").style.display = "none";
		document.getElementById("resultblock").style.display = "block";
	});

	document.getElementById("resultback").addEventListener("click", function() {
		document.getElementById("docblock").style.display = "none";
		document.getElementById("searchblock").style.display = "block";
		document.getElementById("resultblock").style.display = "none";
	});

	if (user)
		document.getElementById("user").innerHTML = user;
	else
		document.getElementById("user").innerHTML = "not set";
		
}

//GENERIC

function setParameters(idexp){
	user  = checkCookie(idexp+"_idunit", "_idunit");
	index = checkCookie(idexp+"rankingAlg","rankingAlg");
	color = checkCookie(idexp+"linkColor","linkColor")
}


//function getHost() {
//	var result = window.location.protocol + "//" + window.location.hostname;
//	var port = window.location.port;
//	if (port != null && port != "") {
//		result = result + ":" + port;
//	}
//	var path = window.location.pathname;
//	return result + path;
//}

//Not used: just in case we need to read/set cookies in cross-domain calls
function getXMLHttpRequestCORS(){
  var xmlhttp = new XMLHttpRequest();
  if ("withCredentials" in xmlhttp){
	  xmlhttp.withCredentials = true;
    // xmlhttp has 'withCredentials' property only if it supports CORS
  } else if (typeof XDomainRequest != "undefined"){ // if IE use XDR
	  xmlhttp = new XDomainRequest();
  }
  return xmlhttp;
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


function getParameterFromURL(name) {
    url = window.location.search;
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2]);
}

//COOKIES

function checkCookie(cookiename, param) {
	var value = getCookieValue(cookiename);
	if (!value) {
		var urlsearch = window.location.search;
		if (urlsearch){
			value = getParameterFromURL(param);
			if (value)
				setCookie(cookiename,value,EXPDAYS);
		}
	}
	return value;
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookieValue(cname) {
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



// REGISTER EVENT

function registerSearch(user, results, query) {
	var evalue = new Object();
	evalue.query = query;
	var queryResults = JSON.parse(results);
	evalue.took = queryResults.took;
	evalue.hits = queryResults.hits.total;
	registerEvent(IDEXPERIMENT, user, "JSON", "search", evalue, {});
}

function registerPageView(user, results, query, from) {
	var evalue = new Object();
	var queryResults = JSON.parse(results);
	evalue.hits = queryResults.hits.total;
	evalue.query = query;
	evalue.page = from / NRESULTS;
	registerEvent(IDEXPERIMENT, user, "JSON", "page", evalue, {});
}

function registerDocView(user, id, query, ranking) {
	var evalue = new Object();
	evalue.iddoc = id;
	evalue.query = query;
	evalue.ranking = ranking;
	registerEvent(IDEXPERIMENT, user, "JSON", "click", evalue, {});
}

function registerEvent(idconf, idunit, etype, ename, evalue, paramvalues) {
	if (user){
		var xhttp = getXMLHttpRequestCORS();
		var inputJson = new Object();
		inputJson.idunit = idunit;
		inputJson.idconfig = idconf;
		inputJson.etype = etype;
		inputJson.ename = ename;
		inputJson.evalue = evalue;
		inputJson.paramvalues = paramvalues;
	
		xhttp.open("POST", IREPLATFORM_URI + "/IREPlatform/service/event/register", true);
		xhttp.setRequestHeader("Content-Type", "application/json");
		var inputTxt = JSON.stringify(inputJson);
		xhttp.send(inputTxt);
	}
}

// SEARCH

function searchMainWindow() {
	var query = document.getElementById("searchinput").value;
	search(query, 0);
}

function searchResultWindow() {
	var query = document.getElementById("resultsinput").value;
	search(query, 0);
}

function searchSuccess(results, query, from) {
	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "block";

	var resultsObj = JSON.parse(results);
	loadResults(resultsObj, query, from);
	createNextPages(query, resultsObj.hits.total);
	if (from == 0)
		registerSearch(user, results, query);
	registerPageView(user, results, query, from);
	
}

function createNextPages(query, hits) {
	document.getElementById("pages").innerHTML = "";
	for (var i = 0; i < hits; i += 10) {
		var link = document.createElement("A");
		link.setAttribute("href", "javascript:search('" + query + "'," + i
				+ ");");
		link.innerHTML = "&nbsp;&nbsp;";
		link.appendChild(document.createTextNode(i / 10));
		link.innerHTML += "&nbsp;&nbsp;";
		document.getElementById("pages").appendChild(link);
	}
}

function loadResults(results, query, from) {
	document.getElementById("hits").innerHTML = results.hits.total
			+ " documents";
	document.getElementById("time").innerHTML = results.took + " ms.";
	document.getElementById("resultsinput").value = query;
	document.getElementById("resultslist").innerHTML = "";
	for (var i = 0; i < results.hits.hits.length; i++) {
		addResult(results.hits.hits[i], query, from + i + 1); // ranking
																// starting in 1
	}
}

function getSnippetField(field, fieldarray) {
	var snippet = "";
	if (fieldarray) {
		snippet = snippet + "<p><strong>" + field + ": </strong>"
		for (var i = 0; i < fieldarray.length; i++) {
			snippet = snippet + "<span>" + fieldarray[i] + "</span>";
		}
		snippet = snippet + "</p>";
	}
	return snippet;
}

function getSnippet(item) {
	var snippet = "";
	if (item.highlight.title != null)
		snippet = snippet + getSnippetField("title", item.highlight.title);
	if (item.highlight.author != null)
		snippet = snippet + getSnippetField("author", item.highlight.author);
	if (item.highlight.bibliography != null)
		snippet = snippet
				+ getSnippetField("bibliography", item.highlight.bibliography);
	if (item.highlight.body != null)
		snippet = snippet + getSnippetField("body", item.highlight.body);
	return snippet;
}

function addResult(item, query, ranking) {
	var title = item._source.title;
	var id = item._id;
	var snippet = getSnippet(item);

	var li = document.createElement("li");
	li.setAttribute("id", id);

	var titleElement = document.createElement("A");
	titleElement.setAttribute("href", "javascript:showDocument(" + id + ",'"
			+ query + "'," + ranking + ");");
	//titleElement.setAttribute("class", "result_title");
	titleElement.setAttribute("style","color:"+color+";");
	titleElement.appendChild(document.createTextNode(title));

	var snippetElement = document.createElement("P");
	snippetElement.innerHTML = snippet;

	li.appendChild(titleElement);
	li.appendChild(snippetElement);
	document.getElementById("resultslist").appendChild(li);
}
// Create request body: query and highlight, the latter is useful to get
// snippets
// (https://www.elastic.co/guide/en/elasticsearch/guide/current/highlighting-intro.html)
function getQueryBody(query, from) {
	return "{\"highlight\":{\"fields\":{\"bibliography\":{},\"author\":{},\"body\":{},\"title\":{}}},\"size\":10,\"query\":{\"multi_match\":{\"query\":\""+query+"\",\"fields\":[\"body\",\"title\",\"bibliography\",\"author\"]}},\"_source\":[\"title\"],\"from\":"+from+"}";
}

// Launch query in Elastic Search
function search(query, from) {
	var xhttp = getXMLHttpRequestCORS();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			searchSuccess(this.responseText, query, from);
		}
	};
	//only with POST instead of GET, all the options work as expected (eg. highlight)
	xhttp.open("POST", ELASTIC_URI + "/" + index + "/" + ELASTIC_DOCTYPE
			+ "/_search", true);
	xhttp.setRequestHeader("Content-Type", "application/json");
	var param = getQueryBody(query, from); 
	xhttp.send(param);
}

// SHOW DOCUMENT

function showDocumentSuccess(esdoc, id, query, ranking) {
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "none";
	document.getElementById("docblock").style.display = "block";

	var obj = JSON.parse(esdoc);
	document.getElementById("doctitle").innerHTML = obj._source.title;
	document.getElementById("docauthor").innerHTML = obj._source.author;
	document.getElementById("docbibliography").innerHTML = obj._source.bibliography;
	document.getElementById("docbody").innerHTML = obj._source.body;

	registerDocView(user, id, query, ranking);
}

function showDocument(id, query, ranking) {
	var xhttp = getXMLHttpRequestCORS();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			showDocumentSuccess(this.responseText, id, query, ranking);
		}
	};
	xhttp.open("GET", ELASTIC_URI + "/" + index + "/" + ELASTIC_DOCTYPE + "/"
			+ id, true);
	xhttp.send();
}
