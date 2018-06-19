/**
 * Web Search Engine used as support for three different experiments: ColorExp, which varies 
 * the color of the search results, and RankingExp, which changes the ranking algorithm used in the queries, 
 * and Ranking+Color, which varies both variables in a multivariate experiment.
 * The search engine used is ElasticSearch, located at ELASTIC_URI
 * The experimental platform, where the experiments are defined is located at PLATFORM_URI. 
 * The events (interaction with the user) are registered there.
 * The Javascript library jsApone.js is used to interact with the experimental platform.
 * 
 * @author mmarrero
 * 
 */

const ELASTIC_URI = "http://ireplatform.ewi.tudelft.nl:9200";     //location of the ElasticSearch service to be used
const ELASTIC_DOCTYPE = "cran"; 								  //collection indexed in ElasticSearch

const NRESULTS = 10; //number of documents displayed per page
const EXPDAYS = 60;  //cookies expiration time

//experimental variables
var user;
var index;
var color;

function init() {
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
	
	document.getElementById("searchbutton").disabled = true;	
	apone = jsApone("http://localhost:8080/APONE", "5b27838bda0ed12d7dc20001"); // JSAPONE. Module creation
	apone.getExperimentalConditions(function(expCond) {startExperiment(expCond)}); //JSAPONE. Get experimental conditions
}

/*
 * When the experimental conditions have been received, the user can make queries
 */
function startExperiment(expCond){
	var variables = expCond.variables;
	index = variables.rankingAlg;
	color = variables.linkColor;
	user = expCond.idUnit;
	document.getElementById("user").innerHTML = user;
	document.getElementById("color").innerHTML = color;
	document.getElementById("ranking").innerHTML = index;
	document.getElementById("searchbutton").disabled = false; //Enable search button when the experiment is ready	
}



/*
 * REGISTER EVENTS
 * 
 * Functions to register the interaction with the user (search, page view and document view).
 */ 
function registerSearch(user, results, query) {
	var evalue = new Object();
	evalue.query = query;
	var queryResults = JSON.parse(results);
	evalue.took = queryResults.took;
	evalue.hits = queryResults.hits.total;
	
	apone.registerJSON("search", evalue, function(info) {console.log("search event registered")}, 
			function(status) {console.log(status);});
}

function registerPageView(user, results, query, from) {
	var evalue = new Object();
	var queryResults = JSON.parse(results);
	evalue.hits = queryResults.hits.total;
	evalue.query = query;
	evalue.page = from / NRESULTS;
	
	apone.registerJSON("page", evalue, function(info) {console.log("page view event registered")}, 
			function(status) {console.log(status);});
}

function registerDocView(user, id, query, ranking) {
	var evalue = new Object();
	evalue.iddoc = id;
	evalue.query = query;
	evalue.ranking = ranking;

	apone.registerJSON("click", evalue, function(info) {console.log("doc view event registered")}, 
			function(status) {console.log(status);});
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
