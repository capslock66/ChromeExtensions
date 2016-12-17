
function init()
{
    console.log("popup init") ;
    //alert("I am alive");

    var BackgroundPage = chrome.extension.getBackgroundPage() ;
    chrome.storage.sync.get('scannerList', function (obj) 
    { 
       BackgroundPage.Request.scannerList = obj.scannerList;
       console.log("storage get callback : saved scanners : \n" , BackgroundPage.Request.scannerList) ; 
    }) ; 
    
    var req = BackgroundPage.Request.request;   // Resquest function. request property

    var url = $("#url")[0] ;
    console.log("before",url.value);
    url.value = "https://www.codeproject.com/articles/5498/tracetool-the-swiss-army-knife-of-trace" ;
    console.log("after",url.value);
    
    var button = document.getElementById("get_request_button");
    button.addEventListener("click", function () {
        doRequest();
    });

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
*/

/*
XDA : search last .postCount
<a href="showpost.php?p=69842275&amp;postcount=2373" target="new" rel="nofollow" 
    id="postcount69842275" 
    name="2373" 
    class="postCount" 
    title="Permalink to post #2373">

    <strong>#2373</strong>
    
</a>
*/

function doRequest()
{
    console.log("doRequest") ;

    //ttrace.setHost("localHost:85");
    //ttrace.queryClientId() ;
    //ttrace.debug().send("DoRequest");
    //var url = $("#url")[0].value ;

   
    var BackgroundPage = chrome.extension.getBackgroundPage() ;
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
            
            console.log("onLoadScanner.targetSite = " , onLoadScanner.targetSite) ;
            console.log("onLoadScanner.searchKey = " , onLoadScanner.searchKey) ;
            
            // var result = "status: " + xhr.status + " " + xhr.statusText + "<br />";
            // var header = xhr.getAllResponseHeaders();
            // var all = header.split("\r\n");
            // for (var i = 0; i < all.length; i++) {
                // if (all[i] != "")
                    // result += ("<li>" + all[i] + "</li>");
            // }
            
            // create an empty element, not stored in the document
            var newDivElement = $('<div></div>' );
          
            // Parse the XMLHttpRequest result into the new element
            newDivElement.html(xhr.responseText);
                  
            // search line in new element
            var spanLines = $(onLoadScanner.searchKey, newDivElement);              
            if (spanLines.length != 0)
            {
                console.log("found search length = " + spanLines.length) ;
                var spanLine = spanLines[spanLines.length-1] ;
                
                $("#response_body").append("spanLine : " + spanLine.innerHTML + "<br>");

                //var commentCount = spanLine.textContent.match(/\d+/)[0] ;        //    /\d+/   : get numbers in the string. Result is an array.
                //console.log("Comment count : " + commentCount) ;
                //$("#response_body").append("Comment count : " + commentCount+ "<br>");
            }
        }        
        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        xhr.send(null);                     // fire onload
    }

    // console.log("Get " + url);
    // xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
    // xhr.send(null);                     // fire onload
    
    return ;
    var scannerList = [] ;
    var scanner = {};
    scanner.targetSite = "https://www.codeproject.com/articles/5498/tracetool-the-swiss-army-knife-of-trace";
    scanner.searchKey = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.searchResult = spanLine.outerHTML ;        // don't save the dom but it's representation. TODO : remove : store only the 2 hashs
    scanner.hash1 = 123 ;
    scanner.hash2 = 456 ;       
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.codeproject.com/Articles/191930/Android-Usb-Port-Forwarding";
    scanner.searchKey = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.searchResult = spanLine.outerHTML ;        // don't save the dom but it's representation. TODO : remove : store only the 2 hashs
    scanner.hash1 = 123 ;
    scanner.hash2 = 456 ;   
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "https://www.codeproject.com/Articles/6009/AidaNet-Network-resources-inventory";
    scanner.searchKey = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.searchResult = spanLine.outerHTML ;        // don't save the dom but it's representation. TODO : remove : store only the 2 hashs
    scanner.hash1 = 123 ;
    scanner.hash2 = 456 ;   
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "http://forum.xda-developers.com/android/help/qa-android-reverse-tethering-3-19-t2908241/page3000";
    scanner.searchKey = ".postCount" ;
    scanner.searchResult = spanLine.outerHTML ;        // don't save the dom but it's representation. TODO : remove : store only the 2 hashs
    scanner.hash1 = 123 ;
    scanner.hash2 = 456 ;   
    scannerList.push(scanner);
    
    scanner = {};
    scanner.targetSite = "http://forum.xda-developers.com/showthread.php?t=1371345&page=3000";
    scanner.searchKey = ".postCount" ;
    scanner.searchResult = spanLine.outerHTML ;        // don't save the dom but it's representation. TODO : remove : store only the 2 hashs
    scanner.hash1 = 123 ;
    scanner.hash2 = 456 ;   
    scannerList.push(scanner);
    
    console.log ("save all scanner") ;
    chrome.storage.sync.set({'scannerList': scannerList}, function (obj) 
    {
        console.log("storage set callback") ; 
    }) ;         
    
}

init();
