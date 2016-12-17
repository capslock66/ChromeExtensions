
function init()
{
    //ttrace.setHost("localHost:85");
    //ttrace.queryClientId() ;
    //ttrace.debug().send("DoRequest");
    //var url = $("#url")[0].value ;

    console.log("popup init") ;
    //alert("I am alive");

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

*/



function doRequest()
{
    console.log("doRequest") ;
    var scannedCount = 0;
    
    var BackgroundPage = chrome.extension.getBackgroundPage() ;
    for (var i in BackgroundPage.Request.scannerList) 
    {
        var currentScanner = BackgroundPage.Request.scannerList[i] ;
        currentScanner
    }

    for (var i in BackgroundPage.Request.scannerList) 
    {
        var currentScanner = BackgroundPage.Request.scannerList[i] ;
        var url = currentScanner.targetSite ;

        var xhr = new XMLHttpRequest();
        xhr.scanner = currentScanner ; // inject 
        
        xhr.onload = function(e) 
        {
            // e : ProgressEvent
            // e.currentTarget : XMLHttpRequest
            // e.currentTarget.responseURL
            var onloadRequest = e.currentTarget ;
            var onLoadScanner = e.currentTarget.scanner ;
            
            $("#response_body").append(onLoadScanner.targetSite + "<br>") ;
            $("#response_body").append("Selector : " + onLoadScanner.searchSelector + "<br>") ;
            console.log("onLoadScanner.targetSite = " , onLoadScanner.targetSite) ;
            console.log("onLoadScanner.searchSelector = " , onLoadScanner.searchSelector) ;
                       
            // create an empty element, not stored in the document
            var newDivElement = $('<div></div>' );
          
            // Parse the XMLHttpRequest result into the new element
            newDivElement.html(onloadRequest.responseText);
                  
            // search key in new element
            var searchResults = $(onLoadScanner.searchSelector, newDivElement);              
            if (searchResults.length != 0)
            {
                var lastSearchResult = searchResults[searchResults.length-1] ;
                var resultString = lastSearchResult.outerHTML ;
                $("#response_body").append("last result : " + resultString + "<br>");
                console.log("lastSearchResult : " + resultString);
                var hash = resultString.hashCode() ;
                $("#response_body").append("hash : " + hash + "<br>");

                if (onLoadScanner.hash !== -1 && onLoadScanner.hash !== hash)
                {
                    console.log("Different hash. Stored = " + onLoadScanner.hash + ", calculated = " + hash) ;
                }
                
                onLoadScanner.hash = hash ;
                scannedCount++ ;
                if (scannedCount == BackgroundPage.Request.scannerList.length)
                {
                    chrome.storage.sync.set({'scannerList': BackgroundPage.Request.scannerList}, function (obj) 
                    {
                        console.log("storage set callback") ; 
                    }) ;                             
                }
            
                //var commentCount = lastSearchResult.textContent.match(/\d+/)[0] ;        //    /\d+/   : get numbers in the string. Result is an array.

            } else {
                console.log("No result") ;
                $("#response_body").append("No result <br>");
            }            
            $("#response_body").append("------------------------<br>");
        }        
        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        xhr.send(null);                     // fire onload
    }   
}

function initStorage()
{
// https://www.devexpress.com/Support/Center/Question/Details/T166379
// https://www.devexpress.com/support/center/Question/Details/T450669
// https://www.devexpress.com/Support/Center/Question/Details/T455210


    // to in each scanner : 
    // -> enabled true/false, 
    // -> searchPosition (-1 = last), 
    // -> innerHtml/outerHtml
    // -> trigger if search count change
    // -> Validated. If not a counter is displayed on the Icon
    
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
