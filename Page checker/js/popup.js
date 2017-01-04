
function init() 
{
    var BackgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = BackgroundPage.ttrace ;
    console.log("popup init. ttrace.host : " + ttrace.host) ;    
    ttrace.debug.send("popup init");

    chrome.storage.sync.get('scannerList', function (obj) 
    { 
       BackgroundPage.scannerList = obj.scannerList;
       console.log("storage get callback : saved scanners : \n" , BackgroundPage.scannerList) ; 
    }) ; 

    $("#check_request_button").click(function(){
       doRequest();
    }); 
    
    $("#init_storage_button").click(function () {
        initStorage();
    });

}


function doRequest()
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;

    console.log("doRequest") ;
    ttrace.debug.send("doRequest");

    var scannedCount = 0;
    var responseBody = $("#response_body") ;
    
    // http://www.w3schools.com/html/html_tables.asp
    // http://www.w3schools.com/html/tryit.asp?filename=tryhtml_table_id1
    
    var resultTable = $("<table style='width:100%'></table>" );
    responseBody.append(resultTable) ;
    
    var headerTr = $("<tr></tr>");
    resultTable.append(headerTr);
    
    //headerTr.append($("<th>Selector</th>")) ;
    //headerTr.append($("<th>resultString</th>")) ;
    //headerTr.append($("<th>hash</th>")) ;
    //headerTr.append($("<th>TargetSite</th>")) ;
    
    for (var i in backgroundPage.scannerList) 
    {
        var currentScanner = backgroundPage.scannerList[i] ;
        currentScanner.index = i ;
        var url = currentScanner.TargetSite ;
        var xhr = new XMLHttpRequest();
        xhr.scanner = currentScanner ; // save to xhr for later retreival (onload callback) 

        xhr.onload = function(e) 
        {
          // e : ProgressEvent
          // e.currentTarget : XMLHttpRequest
          // e.currentTarget.responseURL
          var onloadRequest = e.currentTarget ;
          var onLoadScanner = e.currentTarget.scanner ;
          // responseBody.append(onLoadScanner.TargetSite + "<br>") ;
          
          // create an empty element, not stored in the document
          var newDivElement = $('<div></div>' );
        
          // Parse the XMLHttpRequest result into the new element
          newDivElement.html(onloadRequest.responseText);
                
          // search key in new element
          var searchResults = $(onLoadScanner.SearchSelector, newDivElement);  
          onLoadScanner.newHash = 0 ;  
          onLoadScanner.resultString  = "Nothing !";  
          
          if (searchResults.length !== 0)
          {
              var index = searchResults.length-1  ;   // TODO : use onLoadScanner.searchPosition
              var lastSearchResult = searchResults[index] ;
              onLoadScanner.resultString = lastSearchResult.outerHTML
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  //.replace(/&/g, '&amp;')
                  //.replace(/"/g, '&quot;')
                  ;                
              onLoadScanner.newHash = onLoadScanner.resultString.hashCode() ;                  
          }            
        
          var ScannerTr = $("<tr></tr>");
          var ScannerTd = $("<td></td>");
          resultTable.append(ScannerTr);
          ScannerTr.append(ScannerTd);
          
          var hashToDisplay = onLoadScanner.newHash ;
          if (onLoadScanner.Hash !== -1 && onLoadScanner.Hash !== onLoadScanner.newHash)
              hashToDisplay = "<b>" + hashToDisplay + "</b>" ;
          
          onLoadScanner.inputName = $("<input value='"+onLoadScanner.Name+"'>") ;
          $(onLoadScanner.inputName).on("change keyup",function()   // change paste keyup
          {
              console.log($(this).val());
              onLoadScanner.Name = $(this).val() ;
          }) ;
          
          onLoadScanner.inputSearchSelector = $("<input value='"+onLoadScanner.SearchSelector+"'>") ;
          $(onLoadScanner.inputSearchSelector).on("change keyup",function()   // change paste keyup
          {
              console.log($(this).val());
              onLoadScanner.SearchSelector = $(this).val() ;
          }) ;
          
          //var tdSearchSelector = $("<td></td>") ;
          //tdSearchSelector.append(onLoadScanner.inputSearchSelector) ;
          
          //ScannerTd.append(onLoadScanner.inputName);
          //ScannerTd.append($("<br>"));
          //ScannerTd.append(onLoadScanner.inputSearchSelector) ;
          
          var scannerView = $('.templates').clone();
          scannerView.find('.template_Name')[0].innerText = onLoadScanner.Name ;
          
          ScannerTd.append(scannerView) ;
          
          
          //ScannerTr.append(tdSearchSelector) ;
          
          //ScannerTr.append($("<td>" + onLoadScanner.resultString   + "</td>")) ;
          //ScannerTr.append($("<td>" + onLoadScanner.newHash        + "</td>")) ;
          //ScannerTr.append($("<td>" + onLoadScanner.TargetSite     + "</td>")) ;            
          
          
          
          
          
          
          onLoadScanner.Hash = onLoadScanner.newHash ;
          scannedCount++ ;
          if (scannedCount == backgroundPage.scannerList.length)
              saveStorage(backgroundPage) ;                            
          
        } ;       
        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        xhr.send(null);                     // fire onload
    }   
}

function saveStorage(backgroundPage)
{
   // create a copy of the scannerList to save only needed fields
    var scannerCopyList = [] ;
    for (var i in backgroundPage.scannerList) 
    {
        var scanner     = backgroundPage.scannerList[i] ;
        var scannerCopy = {} ;
        scannerCopy.Name           = scanner.Name ;
        scannerCopy.ArraySelector  = scanner.ArraySelector ;
        scannerCopy.Enabled        = scanner.Enabled ;
        scannerCopy.Validated      = scanner.Validated ;
        scannerCopy.TargetSite     = scanner.TargetSite ;
        scannerCopy.SearchSelector = scanner.SearchSelector ; 
        scannerCopy.Hash           = scanner.Hash ;
        scannerCopyList.push(scannerCopy);        
    }
    
    chrome.storage.sync.set({'scannerList': backgroundPage.scannerList}, function (obj) 
    {
        //console.log("storage set callback") ;
        //responseBody.append("storage set callback") ; 
        //ttrace.debug.send("storage set callback") ; 
    }) ;                             
    
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
    scanner.Name = "CodeProject - Tracetool" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "https://www.codeproject.com/articles/5498/tracetool-the-swiss-army-knife-of-trace";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "CodeProject - Port Forwarding" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "https://www.codeproject.com/Articles/191930/Android-Usb-Port-Forwarding";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "CodeProject - AidaNet" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "https://www.codeproject.com/Articles/6009/AidaNet-Network-resources-inventory";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = " Xda - Reverse Tethering -Q&A" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "http://forum.xda-developers.com/android/help/qa-android-reverse-tethering-3-19-t2908241/page3000";
    scanner.SearchSelector = ".postCount" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "Xda - Reverse Tethering - Discussion" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "http://forum.xda-developers.com/showthread.php?t=1371345&page=3000";
    scanner.SearchSelector = ".postCount" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - Does the Silverlight/WPF Dxgrid take the icon into consideration when calculating BestFit" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "https://www.devexpress.com/Support/Center/Question/Details/T166379";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - How to show a child ExpandoObjects in TreeListControl" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "https://www.devexpress.com/support/center/Question/Details/T450669";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - The error icon's width isn't taken into account when the BestFit operation is calculated" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.TargetSite = "https://www.devexpress.com/Support/Center/Question/Details/T455210";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    console.log ("save all scanner") ;
    chrome.storage.sync.set({'scannerList': scannerList}, function (obj) 
    {
        console.log("storage set callback") ; 
    }) ;         
}

String.prototype.hashCode = function(){
    if (Array.prototype.reduce){
        return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);              
    } 
    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
} ;

init();



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
