function init()
{
    var req = chrome.extension.getBackgroundPage().Request.request;
    req.nameE = document.getElementById("header_name");
    req.valueE = document.getElementById("header_value");
    req.nameE.value = req.hname;
    req.valueE.value = req.hvalue;
    document.getElementById("url").value = req.url;
    document.getElementById("content_body").value = req.body;
    var list = document.getElementById("header_list");
    list.innerHTML = renderHeaders()

    document.getElementById("url").addEventListener("keyup", onUrlChanged);
    document.getElementById("url").addEventListener("blur", onUrlChanged);

    document.getElementById("header_name").addEventListener("keyup", onHeaderChanged);
    document.getElementById("header_name").addEventListener("blur", onHeaderChanged);

    document.getElementById("header_value").addEventListener("keyup", onHeaderChanged);
    document.getElementById("header_value").addEventListener("blur", onHeaderChanged);

    document.getElementById("add_header_button").addEventListener("click", onAddChangeHeader);

    document.getElementById("content_body").addEventListener("keyup", onBodyChanged);
    document.getElementById("content_body").addEventListener("blur", onBodyChanged);

    var methods = ["GET", "POST", "DELETE", "HEAD", "PUT"];
    for (var i=0; i<methods.length;i++) {
        (function(index){
            var button = document.getElementById(methods[i].toLowerCase() + "_request_button");
            button.addEventListener("click", function () {
                doRequest(methods[index]);
            });
        })(i);
    }
}

function onHeaderChanged()
{
    var req = chrome.extension.getBackgroundPage().Request.request;
    req.hname = req.nameE.value;
    req.hvalue = req.valueE.value;
}

function onUrlChanged()
{
    var req = chrome.extension.getBackgroundPage().Request.request;
    req.url = document.getElementById("url").value;;
}

function renderHeaders()
{
    var req = chrome.extension.getBackgroundPage().Request.request;
    var html = "<table border=1>";
    html += "<tr><th>name</th><th>value</th></tr>";
    for (var i in req.headers) {
        html += "<tr><td align=\"left\">" + i + "</td><td align=\"right\">" + req.headers[i] + "</td></tr>";
    }
    html += "</table>"
    return html;
}

function onAddChangeHeader()
{
    var req = chrome.extension.getBackgroundPage().Request.request;
    var name = req.nameE.value;
    if (!name) {
        return;
    }
    var value = req.valueE.value;
    if (value == "##") {
        delete req.headers[name];
    } else {
        req.headers[name] = value;
    }
    req.nameE.value = req.valueE.value = "";
    onHeaderChanged();
    var list = document.getElementById("header_list");
    list.innerHTML = renderHeaders()
}

function onBodyChanged()
{
    var req = chrome.extension.getBackgroundPage().Request.request;
    req.body = document.getElementById("content_body").value;
}

function doRequest(method)
{
    //ttrace.setHost("localHost:85");
    //ttrace.queryClientId() ;
    //ttrace.debug().send("DoRequest", method);

    console.log("----doRequest ---") ;
    $("body").append('Test');
	
	var BackgroundPage = chrome.extension.getBackgroundPage() ;
    var req = BackgroundPage.Request.request;	// Resquest function. request property
    req.method = method;
    req.url = document.getElementById("url").value;
    if (req.method == "POST" || req.method == "PUT") {
        req.body = document.getElementById("content_body").value;
    }

    var xhr = new XMLHttpRequest();
    xhr.open(
        req.method,
        req.url,
        false);

    console.log(method + " " + req.url);
    for (var i in req.headers) {
        xhr.setRequestHeader(i, req.headers[i]);
        console.log(i + " " + req.headers[i]);
    }

	/*

	<div class="tabs">
		<div class="selected">Article</div><div class="unselected">
		    <a href="/script/Articles/ViewDownloads.aspx?aid=5498">Browse Code</a>
		</div>
		<div class="unselected"><a href="/script/Articles/Statistics.aspx?aid=5498">Stats</a></div>
		<div class="unselected"><a href="/script/Articles/ListVersions.aspx?aid=5498">Revisions (33)</a></div>
		<div class="unselected"><a href="/script/Articles/ListAlternatives.aspx?aid=5498">Alternatives</a></div>

		<div class="unselected">
		    <a href="WebControls/#_comments" id="ctl00_ArticleTabs_CommentLink" class="anchorLink">Comments 
			<span id="ctl00_ArticleTabs_CmtCnt">(578)</span></a>
		</div>
	</div>	

	selector
	--------------
	#ctl00_ArticleTabs_CommentLink
	
	xpath
	-----------
	//*[@id="ctl00_ArticleTabs_CommentLink"]
	
	
	*/
	
    xhr.onload = function() {
        var result = "status: " + xhr.status + " " + xhr.statusText + "<br />";
        var header = xhr.getAllResponseHeaders();
        var all = header.split("\r\n");
        for (var i = 0; i < all.length; i++) {
            if (all[i] != "")
                result += ("<li>" + all[i] + "</li>");
        }

        //document.getElementById("ifrm").setAttribute('src',document.getElementById("url").value);
        //document.getElementById("response_header").innerHTML = result;
        //document.getElementById("response_body").innerText = xhr.responseText;
        $("response_body").prepend(xhr.responseText);
        
		// create an empty element, not stored in the document
        var newDivElement = $('<div></div>' );
		
		// Parse the XMLHttpRequest result into the new element
        newDivElement.html(xhr.responseText);
		
        
        // search line
        var spanLine = $("#ctl00_ArticleTabs_CommentLink", newDivElement);
           
        console.log(spanLine[0]);
        
		//<a href="WebControls/#_comments" id="ctl00_ArticleTabs_CommentLink" class="anchorLink">Comments 
		//	<span id="ctl00_ArticleTabs_CmtCnt">(578)</span>
		//</a>

        
    }
    xhr.send(req.body);
}

init();
