// manifest key comes from 
// c:\Users\Parent\AppData\Local\Google\Chrome\User Data\Default\Extensions\cgciaejemkddoollpocbepblfglddmkf\2015.10.5.42816_0\manifest.json
// something about http://www.webmaster-gratuit.com/radio/nostal
//
// The ID will be cgciaejemkddoollpocbepblfglddmkf on all browsers for this extension 
// chrome.storage.sync will synchronize data on all browsers for this extension

function init()
{
    console.log("popup init") ;    
    ttrace.host = "localHost:85";

    var BackgroundPage = chrome.extension.getBackgroundPage() ;
    chrome.storage.sync.get('scannerList', function (obj) 
    { 
       BackgroundPage.Request.scannerList = obj.scannerList;
       console.log("storage get callback : saved scanners : \n" , BackgroundPage.Request.scannerList) ; 
    }) ; 
    
    //var req = BackgroundPage.Request.request;   // Resquest function. request property

    //var url = $("#url")[0] ;
    //console.log("before",url.value);
    //url.value = "https://www.codeproject.com/articles/5498/tracetool-the-swiss-army-knife-of-trace" ;
    //console.log("after",url.value);
    
    var checkButton = document.getElementById("check_request_button");
    checkButton.addEventListener("click", function () {
        doRequest();
    });

    var initButton = document.getElementById("init_storage_button");
    initButton.addEventListener("click", function () {
        initStorage();
    });

}


/*
Code project : search class anchorLink 
----------------------------------------
<div class="tabs">
    <div class="selected">Article</div><div class="unselected"><a href="/script/Articles/ViewDownloads.aspx?aid=5498">Browse Code</a></div>
    <div class="unselected"><a href="/script/Articles/Statistics.aspx?aid=5498">Stats</a></div>
    <div class="unselected"><a href="/script/Articles/ListVersions.aspx?aid=5498">Revisions (33)</a></div>
    <div class="unselected"><a href="/script/Articles/ListAlternatives.aspx?aid=5498">Alternatives</a></div>        
    <div class="unselected">
        <a href="WebControls/#_comments" id="ctl00_ArticleTabs_CommentLink" class="anchorLink">Comments 
        <span id="ctl00_ArticleTabs_CmtCnt">(578)</span></a>
    </div>
</div>         

XDA : search last class postCount
--------------------------------------
<a href="showpost.php?p=69842275&amp;postcount=2373" target="new" rel="nofollow" 
    id="postcount69842275" 
    name="2373" 
    class="postCount" 
    title="Permalink to post #2373">
    <strong>#2373</strong>
</a>

DevExpress : search id question-modified-on
----------------------------------------------
<dd id="question-modified-on">    
   <abbr role="datetime" class="date" title="2016-11-15T12:26:15.160Z">15/11/2016 13:26:15</abbr>
</dd>


Other css selector
http://www.w3schools.com/cssref/css_selectors.asp
http://www.w3schools.com/cssref/sel_nth-child.asp
http://www.w3schools.com/cssref/sel_nth-last-child.asp

$('.someClass:nth-child(1)')        First
$('.someClass:nth-last-child(1)')   Last

*/

function doRequest()
{
    console.log("doRequest") ;
    ttrace.debug.send("doRequest. ClientId=" + ttrace.clientId);

    var scannedCount = 0;
    var responseBody = $("#response_body") ;
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    
    var resultTable = $("<table style='width:100%'></table>" );
    responseBody.append(resultTable) ;
    
    var headerTr = $("<tr></tr>");
    resultTable.append(headerTr);
    
    headerTr.append($("<th>targetSite</th>")) ;
    headerTr.append($("<th>Selector</th>")) ;
    headerTr.append($("<th>resultString</th>")) ;
    headerTr.append($("<th>hash</th>")) ;
    
    for (var i in backgroundPage.Request.scannerList) 
    {
        var currentScanner = backgroundPage.Request.scannerList[i] ;
        var url = currentScanner.targetSite ;
        var xhr = new XMLHttpRequest();
        xhr.scanner = currentScanner ; // save to xhr for later retreival (onload callback) 

        xhr.onload = function(e) 
        {
            // e : ProgressEvent
            // e.currentTarget : XMLHttpRequest
            // e.currentTarget.responseURL
            var onloadRequest = e.currentTarget ;
            var onLoadScanner = e.currentTarget.scanner ;
            
            var ScannerTr = $("<tr></tr>");
            resultTable.append(ScannerTr);
            
            ScannerTr.append($("<td>"+onLoadScanner.targetSite+"</td>")) ;
            ScannerTr.append($("<td>Selector</td>")) ;
            ScannerTr.append($("<td>resultString</td>")) ;
            ScannerTr.append($("<td>hash</td>")) ;
            
            
            // <td>targetSite</td>
            responseBody.append(onLoadScanner.targetSite + "<br>") ;
            // <td>Selector</td>
            responseBody.append("Selector : " + onLoadScanner.searchSelector + "<br>") ;
            
            ttrace.debug.send("onLoadScanner.targetSite = " + onLoadScanner.targetSite) ;
            ttrace.debug.send("onLoadScanner.searchSelector = " + onLoadScanner.searchSelector) ;
            
            // create an empty element, not stored in the document
            var newDivElement = $('<div></div>' );
          
            // Parse the XMLHttpRequest result into the new element
            newDivElement.html(onloadRequest.responseText);
                  
            // search key in new element
            var searchResults = $(onLoadScanner.searchSelector, newDivElement);              
            if (searchResults.length != 0)
            {
                var index = searchResults.length-1  ;   // TODO : use onLoadScanner.searchPosition
                var lastSearchResult = searchResults[index] ;
                var resultString = lastSearchResult.outerHTML ;
                
                ttrace.debug.send("lastSearchResult : " + resultString);
                resultString = resultString
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    //.replace(/&/g, '&amp;')
                    //.replace(/"/g, '&quot;')
                    ;
    
                // <td>resultString</td>
                responseBody.append("result [" + index + "] : <br>" + resultString + "<br>");
                
                var hash = resultString.hashCode() ;
                

                if (onLoadScanner.hash !== -1 && onLoadScanner.hash !== hash)
                {
                    // <td>hash</td>
                    responseBody.append("Different hash. Stored = " + onLoadScanner.hash + ", calculated = " + hash) ;
                    ttrace.warning.send("Different hash. Stored = " + onLoadScanner.hash + ", calculated = " + hash) ;
                } else {
                    // <td>hash</td>
                    responseBody.append("hash : " + hash + "<br>");
                    ttrace.debug.send("hash : " + hash );
                }
                
            
            } else {
                ttrace.warning.send("No result") ;
                // <td>...resultString...</td>
                // <td>...hash...        </td>
                responseBody.append("No result <br>");
            }            
            
            responseBody.append("------------------------<br>");
            ttrace.debug.send("---");
            
            onLoadScanner.hash = hash ;
            scannedCount++ ;
            if (scannedCount == backgroundPage.Request.scannerList.length)
            {
                chrome.storage.sync.set({'scannerList': backgroundPage.Request.scannerList}, function (obj) 
                {
                    //responseBody.append("storage set callback") ; 
                    //ttrace.debug.send("storage set callback") ; 
                }) ;                             
            }
        }        
        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        xhr.send(null);                     // fire onload
    }   
}

function initStorage()
{
    // to do in each scanner : 
    // -> enabled true/false, 
    // -> searchPosition (-1 = last, -2 = use count), 
    // -> afterSearchUse innerHtml/outerHtml/...
    // -> Validated. If not a counter is displayed on the Icon
    // -> Title
    
    var scannerList = [] ;
    var scanner = {};
    scanner.targetSite = "https://www.codeproject.com/articles/5498/tracetool-the-swiss-army-knife-of-trace";
    scanner.searchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.codeproject.com/Articles/191930/Android-Usb-Port-Forwarding";
    scanner.searchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.codeproject.com/Articles/6009/AidaNet-Network-resources-inventory";
    scanner.searchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "http://forum.xda-developers.com/android/help/qa-android-reverse-tethering-3-19-t2908241/page3000";
    scanner.searchSelector = ".postCount" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "http://forum.xda-developers.com/showthread.php?t=1371345&page=3000";
    scanner.searchSelector = ".postCount" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.devexpress.com/Support/Center/Question/Details/T166379";
    scanner.searchSelector = "#question-modified-on" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.devexpress.com/support/center/Question/Details/T450669";
    scanner.searchSelector = "#question-modified-on" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.devexpress.com/Support/Center/Question/Details/T455210";
    scanner.searchSelector = "#question-modified-on" ;
    scanner.hash = -1 ;
    scannerList.push(scanner);
    
    console.log ("save all scanner") ;
    chrome.storage.sync.set({'scannerList': scannerList}, function (obj) 
    {
        console.log("storage set callback") ; 
    }) ;         
}

String.prototype.hashCode = function(){
    if (Array.prototype.reduce){
        return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    } 
    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

init();
