
function init() 
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;
    console.log("popup init. ttrace.host : " + ttrace.host) ;   
    ttrace.debug.send("popup init " );

    $("#check_request_button").click(function(){
       doRequest();
    }); 
    
    $("#init_storage_button").click(function () {
       initStorage();
    });
    
    $(document).ready(function() {
        fillScannerTable() ;
    });
}

function fillScannerTable()
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;
    var responseBody = $("#response_body") ;
   
    var resultTable = $("<table class='result_table'></table>" );
    responseBody.append(resultTable) ;
   
    for (var i in backgroundPage.scannerList) 
    {
        var currentScanner = backgroundPage.scannerList[i] ;
        
        var scannerTemplate = $('.scanner') ;
        var scannerView = scannerTemplate.clone().removeClass("scanner");
        
        // Input name
        var inputName = scannerView.find('.template_Name')[0] ;
        inputName.scanner = currentScanner ;
        currentScanner.inputName = inputName ;
        currentScanner.inputName.value = currentScanner.Name ;
        $(currentScanner.inputName).on("change keyup",function()   // change paste keyup
        {
            console.log($(this).val());
            this.scanner.Name = $(this).val() ;
        }) ;

        // Site
        var inputSite = scannerView.find('.template_Site')[0] ;
        inputSite.scanner = currentScanner ;
        currentScanner.inputSite = inputSite ;
        currentScanner.inputSite.value = currentScanner.Site ;
        $(currentScanner.inputSite).on("change keyup",function()   // change paste keyup
        {
            console.log($(this).val());
            this.scanner.Site = $(this).val() ;
        }) ;
        
        // SearchSelector
        var inputSearchSelector = scannerView.find('.template_SearchSelector')[0] ;
        inputSearchSelector.scanner = currentScanner ;
        currentScanner.inputSearchSelector = inputSearchSelector ;
        currentScanner.inputSearchSelector.value = currentScanner.SearchSelector ;
        $(currentScanner.inputSearchSelector).on("change keyup",function()   // change paste keyup
        {
            console.log($(this).val());
            this.scanner.SearchSelector = $(this).val() ;
        }) ;
        
        // template_CheckNow
        var inputCheckNow = scannerView.find('.template_CheckNow')[0] ;
        inputCheckNow.scanner = currentScanner ;
        currentScanner.inputCheckNow = inputCheckNow ;
        $(currentScanner.inputCheckNow ).click(function(){
            doRequest(this.scanner);
        }); 
        
        // Result
        var inputResult = scannerView.find('.template_Result')[0] ;
        inputResult.scanner = currentScanner ;
        currentScanner.inputResult = inputResult ;
        currentScanner.inputResult.innerText = "" ;
        
        // ArraySelector
        var inputArraySelector = scannerView.find('.template_ArraySelector')[0] ;
        inputArraySelector.scanner = currentScanner ;
        currentScanner.inputArraySelector = inputArraySelector
        currentScanner.inputArraySelector.value = currentScanner.ArraySelector ;
        $(currentScanner.inputArraySelector).on("change keyup",function()   // change paste keyup
        {
            console.log($(this).val());
            this.scanner.ArraySelector = $(this).val() ;
        }) ;
        
        // Enabled
        var inputEnabled = scannerView.find('.template_Enabled')[0] ;
        inputEnabled.scanner = currentScanner ;
        currentScanner.inputEnabled = inputEnabled ;
        $(currentScanner.inputEnabled).prop('checked',currentScanner.Enabled) ;
        $(currentScanner.inputEnabled).on("change keyup",function()   // change paste keyup
        {
            console.log($(this).val());
            this.scanner.Enabled = $(this).prop('checked');
        }) ;
        
        // Validated
        var inputValidated = scannerView.find('.template_Validated')[0] ;
        inputValidated.scanner = currentScanner ;
        currentScanner.inputValidated = inputValidated ;
        $(currentScanner.inputValidated).prop('checked',currentScanner.Validated) ;
        $(currentScanner.inputValidated).on("change keyup",function()   // change paste keyup
        {
            console.log($(this).val());
            this.scanner.Validated = $(this).prop('checked');
        }) ;
        
        // Hash  
        var inputChecksum = scannerView.find('.template_Checksum')[0] ;
        inputChecksum.scanner = inputChecksum ;
        currentScanner.inputChecksum = inputChecksum ;
        var hashToDisplay = currentScanner.newHash ;
        if (currentScanner.Hash !== -1 && currentScanner.Hash !== currentScanner.newHash)
            hashToDisplay = "Updated to" + hashToDisplay ;
        currentScanner.inputChecksum.innerText = hashToDisplay ;        
        
        var ScannerTr = $("<tr></tr>");
        var ScannerTd = $("<td></td>");
        ScannerTr.append(ScannerTd);
        ScannerTd.append(scannerView) ;
        
        resultTable.append(ScannerTr);
        
    }
}

function doRequest(specificScanner)
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;

    console.log("doRequest") ;
    ttrace.debug.send("doRequest");

    var scannedCount = 0;
    // var responseBody = $("#response_body") ;
    // var resultTable = $("<table></table>");
    // responseBody.append(resultTable);
    
    for (var i in backgroundPage.scannerList) 
    {
        var currentScanner = backgroundPage.scannerList[i] ;
        if (specificScanner != null && currentScanner !== specificScanner)
           continue ; 
        
        currentScanner.index = i ;
        var url = currentScanner.Site ;
        var xhr = new XMLHttpRequest();
        xhr.scanner = currentScanner ; // save to xhr for later retreival (onload callback) 

        xhr.onload = function(e) 
        {
          // e : ProgressEvent
          // e.currentTarget : XMLHttpRequest
          // e.currentTarget.responseURL
          var onloadRequest = e.currentTarget ;
          var onLoadScanner = e.currentTarget.scanner ;
          
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
                  //.replace(/</g, '&lt;')
                  //.replace(/>/g, '&gt;')
                  //.replace(/&/g, '&amp;')
                  //.replace(/"/g, '&quot;')
                  ;                
              onLoadScanner.newHash = onLoadScanner.resultString.hashCode() ;                  
          }            

          // update view : result
          onLoadScanner.inputResult.innerText = onLoadScanner.resultString ;
          
          // update view : hash
          var hashToDisplay = onLoadScanner.newHash ;
          if (onLoadScanner.Hash !== -1 && onLoadScanner.Hash !== onLoadScanner.newHash)
              hashToDisplay = "Updated to" + hashToDisplay ;
          onLoadScanner.inputChecksum.innerText = hashToDisplay
          
          // update model : hash
          onLoadScanner.Hash = onLoadScanner.newHash ;

          // save model
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
        scannerCopy.Site     = scanner.Site ;
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
    scanner.Site = "https://www.codeproject.com/articles/5498/tracetool-the-swiss-army-knife-of-trace";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "CodeProject - Port Forwarding" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.codeproject.com/Articles/191930/Android-Usb-Port-Forwarding";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "CodeProject - AidaNet" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.codeproject.com/Articles/6009/AidaNet-Network-resources-inventory";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = " Xda - Reverse Tethering -Q&A" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "http://forum.xda-developers.com/android/help/qa-android-reverse-tethering-3-19-t2908241/page3000";
    scanner.SearchSelector = ".postCount" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "Xda - Reverse Tethering - Discussion" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "http://forum.xda-developers.com/showthread.php?t=1371345&page=3000";
    scanner.SearchSelector = ".postCount" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - Does the Silverlight/WPF Dxgrid take the icon into consideration when calculating BestFit" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.devexpress.com/Support/Center/Question/Details/T166379";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - How to show a child ExpandoObjects in TreeListControl" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.devexpress.com/support/center/Question/Details/T450669";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - The error icon's width isn't taken into account when the BestFit operation is calculated" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.devexpress.com/Support/Center/Question/Details/T455210";
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
