/**
 * Javascript methods shared by the clients of two different experiments: ColorExp (color.html), which varies 
 * the color of the search results, and RankingExp (ranking.html), which changes the ranking algorithm used in the queries.
 * The search engine used is ElasticSearch, located at ELASTIC_URI
 * The experimental platform, where the experiments are defined is located at PLATFORM_URI. 
 * The events (interaction with the user) are registered there.
 * 
 * @author mmarrero
 * 
 */

const PLATFORM_URI = "http://ireplatform.ewi.tudelft.nl:8080/APONE";
const ELASTIC_URI = "http://ireplatform.ewi.tudelft.nl:9200";     //location of the ElasticSearch service to be used
const ELASTIC_DOCTYPE = "cran"; 								  //collection indexed in ElasticSearch

const NRESULTS = 10; //number of documents displayed per page
const EXPDAYS = 60;  //cookies expiration time

//identifier of the experiment defined in the platform. 
//Remember to update this information in the HTML files (function 'init', in body onload event)
var idexperiment; 

//experimental parameters received as query parameteres in the URL
var user;
var index;
var color;

function init(idexp) {
	idexperiment = idexp; //set the experiment identifier. It will be used to register events and in general to interact with the platform
	setParameters(idexp); //read the parameters from the URL and set them in cookies (if they are already set, take the values from the cookies)
	registerExposure(user);
	
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

	if (user){
		document.getElementById("user").innerHTML = user;
		checkIfCompleted();
	}
	else
		document.getElementById("user").innerHTML = "not set";
}


/*
 * COOKIES 
 * 
 * Save in cookies the parameters received in the URL. In this case, the identifier of the user, the ranking algorithm to use, 
 * and the link color to use. Next time the user access the same URL, this information will be set from the parameters, 
 * or from the cookies if there are no parameters in the URL. 
 * 
 * Note: The information in the cookies and the information in the query parameters in the URL could be different for different reasons. 
 * It is up to the experimenter to decide how to manage this. 
 */
function setParameters(idexp){
	user  = checkParam(idexp, "_idunit");
	index = checkParam(idexp+"rankingAlg","rankingAlg");
	color = checkParam(idexp+"linkColor","linkColor")
}

function checkParam(cookiename, param) {
	var urlsearch = window.location.search;
	var value = null;
	if (urlsearch){
		value = getParameterFromURL(param);
		if (value)
			setCookie(cookiename,value,EXPDAYS);
	}
	if (!value) {
		value = getCookieValue(cookiename);
	}
	return value;
}

function getParameterFromURL(name) {
	var query = window.location.search;
	if (!query) return null;
	query = decodeURIComponent(query);
	var encoded = query.replace("?","");
    var decoded = "?"+atob(encoded);
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(decoded);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2]);
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

/*
 * GENERIC METHODS
 */

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

//Contents of Authorization header. It is needed to make calls to the ElasticSearch service located in ireplatform.ewi.tudelft.nl
function make_base_auth(user, pass) {
	  var tok = user + ':' + pass;
	  var hash = btoa(tok);
	  return "Basic " + hash;
}

/*
 * REGISTER EVENTS
 * 
 * Functions to register the interaction with the user (search, page view and document view).
 * An additional function (registerCompleted) register if the user has completed the experiment. This event is predefined in the platform.
 * In the platform, it is used to prevent same users receiving the same experiments when they click in 'Participate in random experiment' 
 * from Monitoring::Users
 * In the client, the experimenter could prevent new interactions to be recorded. The function 'checkIfCompleted' checks if the user has already
 * completed the experiment (that is, if there already exists an event 'completed' for that user and experiment).  
 */ 

function registerSearch(user, results, query) {
	var evalue = new Object();
	evalue.query = query;
	var queryResults = JSON.parse(results);
	evalue.took = queryResults.took;
	evalue.hits = queryResults.hits.total;
	registerEvent(idexperiment, user, "JSON", "search", evalue, null);
}

function registerPageView(user, results, query, from) {
	var evalue = new Object();
	var queryResults = JSON.parse(results);
	evalue.hits = queryResults.hits.total;
	evalue.query = query;
	evalue.page = from / NRESULTS;
	registerEvent(idexperiment, user, "JSON", "page", evalue, null);
}

function registerDocView(user, id, query, ranking) {
	var evalue = new Object();
	evalue.iddoc = id;
	evalue.query = query;
	evalue.ranking = ranking;
	registerEvent(idexperiment, user, "JSON", "click", evalue, null);
}

function registerCompleted(user) {
	registerEvent(idexperiment, user, "STRING", "completed", "", null);
}

function registerExposure(user) {
	registerEvent(idexperiment, user, "STRING", "exposure", "", null);
}

/*
 * @param idexperiment identifier of the experiment
 * @param idunit identifier of the user
 * @param etype type of contents to be saved ("JSON", "STRING" or "BINARY")
 * @param ename name of the event (reserved names are 'exposure' and 'completed')
 * @param evalue contents to be saved in the format specified in etype
 * @param paramvalues if we use PlanOut to define the experiment, we will receive in the URL the parameters we defined in PlanOut with the corresponding 
 * values depending on the variant received. If we did't use PlanOut to define the experiment, this value will be an empty JSON object 
 */
function registerEvent(idexperiment, idunit, etype, ename, evalue, paramvalues) {
	if (user){
		var xhttp = getXMLHttpRequest();
		var inputJson = new Object();
		inputJson.idunit = idunit;
		inputJson.idconfig = idexperiment;
		inputJson.etype = etype;
		inputJson.ename = ename;
		inputJson.evalue = evalue;
		if (paramvalues != null)
			inputJson.paramvalues = paramvalues;
		xhttp.open("POST", PLATFORM_URI+"/service/event/register");
		xhttp.setRequestHeader("Content-Type", "text/plain");   //This same endpoint is also implemented to receive JSON, but if it is used
		var inputTxt = JSON.stringify(inputJson);				//from the client-side as in this case, it may not work due to CORS (Cross-Origin Resource Sharing)
		xhttp.send(inputTxt);
	}
}

function checkIfCompleted(){
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if (this.response == "true")
				window.alert("Experiment already completed"); //or better, if this is true, don't send any event
		}
	};
	if (user){
		xhttp.open("GET", PLATFORM_URI + "/service/user/checkcompleted/"+idexperiment+"/"+user, true);
		xhttp.send();
	}
}

/*
 * SEARCH
 * 
 * Launch the queries in ElasticSearch and display the results
 * More information about ElasticSearch: www.elastic.co/guide/en/elasticsearch/guide
 */ 

function searchMainWindow() {
	var query = document.getElementById("searchinput").value;
	search(query, 0);
}

function searchResultWindow() {
	var query = document.getElementById("resultsinput").value;
	search(query, 0);
}

function search(query, from) {
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			searchSuccess(this.responseText, query, from);
		}
	};
	//only with POST instead of GET, all the options work as expected (eg. highlighting does not work with GET)
	xhttp.open("POST", ELASTIC_URI + "/" + index + "/" + ELASTIC_DOCTYPE
			+ "/_search", true);
	xhttp.setRequestHeader("Content-Type", "application/json");
	
	var auth = make_base_auth('irepuser','irepuser17');
	xhttp.setRequestHeader('Authorization', auth);
	
	var param = getQueryBody(query, from); 
	xhttp.send(param);
}


function getQueryBody(query, from) {
	return "{\"highlight\":{\"fields\":{\"bibliography\":{},\"author\":{},\"body\":{},\"title\":{}}},\"size\":10,\"query\":{\"multi_match\":{\"query\":\""+query+"\",\"fields\":[\"body\",\"title\",\"bibliography\",\"author\"]}},\"_source\":[\"title\"],\"from\":"+from+"}";
}

function searchSuccess(results, query, from) {
	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "block";

	var resultsObj = JSON.parse(results);
	loadResults(resultsObj, query, from);
	createNextPages(query, resultsObj.hits.total);
	if (from == 0){
		registerSearch(user, results, query);
		//registerCompleted(user); //uncomment this if the experiment is considered finished if the user make one query at least
	}
	registerPageView(user, results, query, from);
	
}

function loadResults(results, query, from) {
	document.getElementById("hits").innerHTML = results.hits.total
			+ " documents";
	document.getElementById("time").innerHTML = results.took + " ms.";
	document.getElementById("resultsinput").value = query;
	document.getElementById("resultslist").innerHTML = "";
	for (var i = 0; i < results.hits.hits.length; i++) {
		addResult(results.hits.hits[i], query, from + i + 1); // ranking starting in 1
	}
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
	titleElement.setAttribute("style","color:"+color+";");
	titleElement.appendChild(document.createTextNode(title));
	var snippetElement = document.createElement("P");
	snippetElement.innerHTML = snippet;
	li.appendChild(titleElement);
	li.appendChild(snippetElement);
	document.getElementById("resultslist").appendChild(li);
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


/*
 * SHOW DOCUMENT
 * 
 * Get the information from a specific document from ElasticSearch, and display the information.
 * More information about ElasticSearch: www.elastic.co/guide/en/elasticsearch/guide
 */ 

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
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			showDocumentSuccess(this.responseText, id, query, ranking);
		}
	};
	xhttp.open("GET", ELASTIC_URI + "/" + index + "/" + ELASTIC_DOCTYPE + "/"
			+ id, true);
	var auth = make_base_auth('irepuser','irepuser17');
	xhttp.setRequestHeader('Authorization', auth);

	xhttp.send();
}
