/**
 * 
 */

const ELASTIC_URI="http://localhost:9200";
const ELASTIC_DOCTYPE = "cran";
const USERCOOKIE = "user";
const RANKINGEXP_ID = "59ca668f2ada012eec5088ee";	//Test similarity algorithm
const COLOREXP_ID = "59ca67fc2ada012eec5088f0";	//Test color of the links in the search results
const NRESULTS = 10;

var host;
var index = "default"; 
var idexperiment = COLOREXP_ID; 

function init(){

	host = getHost();
	
	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "block";
	document.getElementById("resultblock").style.display = "none";
	
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
	
	checkCookie();
}


//GENERIC

function getHost(){
	var result = window.location.protocol + "//" + window.location.hostname;
	var port = window.location.port;
	if (port != null && port != ""){
		result = result +":"+port;
	}
	var path = window.location.pathname;
	return result +path;
}

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



//COOKIES

function checkCookie(){
	var cookie = getCookie(USERCOOKIE);
	if (!cookie){
		var randnumber = Math.floor((Math.random() * 10000) + 1);
		cookie = USERCOOKIE + "=" + randnumber + ";"
	}
	document.cookie = cookie;
	document.getElementById("user").innerHTML = document.cookie;
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
    return null;
}



//REGISTER EVENT


function registerSearch(user,results, query){
	var evalue = new Object();
	evalue.put("query", query);
	evalue.put("took", queryResults.get("took") );
	var queryResults = JSON.parse(results);
	evalue.hits = queryResults.hits.total;
	registerEvent(idexperiment,user,"JSON","search",evalue,{});
}

function registerPageView(user,results, query, from){
	var evalue = new Object();
	var queryResults = JSON.parse(results);
	evalue.hits = queryResults.hits.total;
	evalue.query = query;
	evalue.page = from/NRESULTS;
	registerEvent(idexperiment,user,"JSON","page",evalue,{});
}

function registerDocView(user, id, query, ranking){
	var evalue = new Object();
	evalue.iddoc = id;
	evalue.query = query;
	evalue.ranking = ranking;
	registerEvent(idexperiment,user,"JSON","click",evalue,{});
}

function registerEvent(idconfig,idunit,etype,ename,evalue,paramvalues){
	var xhttp = getXMLHttpRequest();
	var inputJson = new Object();
	inputJson.idunit =idunit; 
	inputJson.idconfig = idconf; 
	inputJson.etype = etype;
	inputJson.ename = ename;
	inputJson.evalue = evalue;
	inputJson.paramvalues = paramvalues;
	xhttp.open("POST", "http://localhost:8080/IREPlatform/service/event/register", true);
	xhttp.send(JSON.stringify(inputJson));
}


//SEARCH

function searchMainWindow(){
	var query = document.getElementById("searchinput").value;
	search(query, 0);
}

function searchResultWindow(){
	var query = document.getElementById("resultsinput").value;
	search(query, 0);
}

function searchSuccess(results, query, from){
	document.getElementById("docblock").style.display = "none";
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "block";

	var resultsObj = JSON.parse(results); 
	loadResults(resultsObj, query, from);
	createNextPages(query,resultsObj.hits.total);
	var user = getCookie(USERCOOKIE);
	if (user){
		if (from == 0) registerSearch(user,results,query);
		registerPageView(user,results,query,from);
	}
}

function createNextPages(query, hits){
	document.getElementById("pages").innerHTML="";
	for (var i=0;i<hits;i+=10){
		var link = document.createElement("A");
		link.setAttribute("href", "javascript:search('"+query+"',"+i+");");
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
	titleElement.setAttribute("class", "result_title");
	
	titleElement.appendChild(document.createTextNode(title));

	var snippetElement = document.createElement("P");            
	snippetElement.innerHTML =snippet;
	
	li.appendChild(titleElement);
	li.appendChild(snippetElement);
	document.getElementById("resultslist").appendChild(li);
	
	//Create request body: query and highlight, the latter is useful to get snippets (https://www.elastic.co/guide/en/elasticsearch/guide/current/highlighting-intro.html)
	function getQueryBody(query, from){
		var queryjson = new Object(); 
		var multimatch = new Object();
		multimatch.query = query;
		multimatch.fields = ["body", "title", "bibliography", "author"];
		queryjson.multi_match = multimatch;
		
		var highlight = new Object();
		var fieldshigh = new Object();
		fieldshigh.body = {}; //hightlight matching keywords in 'body' fields
		fieldshigh.title ={}; //hightlight matching keywords in 'title' fields
		fieldshigh.bibliography = {}; //hightlight matching keywords in 'bibliography' fields
		fieldshigh.author = {}; //hightlight matching keywords in 'author' fields
		highlight.fields = fieldshigh;
		
		var querybody = new Object();
		querybody.query = queryjson;
		querybody.highlight = highlight;
		querybody.size = SIZE;
		querybody.from = from;
		querybody._source = ["title"];
		return querybody;
	}

	//Launch query in Elastic Search
	function search(query, from) {
		var xhttp = getXMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				searchSuccess(this.responseText, query, from);
		    }
		};
		xhttp.open("GET", ELASTIC_URI+"/"+index+"/"+ELASTIC_DOCTYPE+"/_search", true);
		xhttp.send(JSON.stringify(getQueryBody(query,from)));
	}

}

//SHOW DOCUMENT

function showDocumentSuccess(esdoc, id, query, ranking){
	document.getElementById("searchblock").style.display = "none";
	document.getElementById("resultblock").style.display = "none";
	document.getElementById("docblock").style.display = "block";
	
	var obj = JSON.parse(esdoc);
	document.getElementById("doctitle").innerHTML = obj._source.title; 
	document.getElementById("docauthor").innerHTML = obj._source.author;
	document.getElementById("docbibliography").innerHTML = obj._source.bibliography;
	document.getElementById("docbody").innerHTML = obj._source.body;
	
	var user = getUser(USERCOOKIE); 
	if (user) registerDocView(user, id, query, ranking);
}

function showDocument(id, query, ranking){
	var xhttp = getXMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			showDocumentSuccess(this.responseText, id, query, ranking);
	    }
	};
	xhttp.open("GET", ELASTIC_URI+"/"+index+"/"+ELASTIC_DOCTYPE+"/"+id, true);
	xhttp.send();
}






