
function init() 
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;
    console.log("popup init. ttrace.host : " + ttrace.host) ;   
    ttrace.debug.send("popup init " );

    
    $(document).ready(function() {
        $("#check_request_button").click(function(){
           doRequest();
        }); 
        
        $("#init_storage_button").click(function () {
           backgroundPage.initStorage();
        });
        fillScannerTable() ;
    });
}

function fillScannerTable()
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;
    var resultTable = $(".scannerList_table");  
   
    for (var i in backgroundPage.scannerList) 
    {
        var currentScanner = backgroundPage.scannerList[i] ;
        
        var scannerTemplate = $('.scanner_div') ;
        var scannerView = scannerTemplate.clone().removeClass("scanner_div");
        
        // Input name
        var inputName = scannerView.find('.template_Name')[0] ;
        inputName.scanner = currentScanner ;
        currentScanner.inputName = inputName ;
        currentScanner.inputName.value = currentScanner.Name ;
        $(currentScanner.inputName).on("change keyup",function()   // change paste keyup
        {
            this.scanner.Name = $(this).val() ;
            backgroundPage.saveStorage();
        }) ;

        // Site
        var inputSite = scannerView.find('.template_Site')[0] ;
        inputSite.scanner = currentScanner ;
        currentScanner.inputSite = inputSite ;
        currentScanner.inputSite.value = currentScanner.Site ;
        $(currentScanner.inputSite).on("change keyup",function()   // change paste keyup
        {
            this.scanner.Site = $(this).val() ;
            backgroundPage.saveStorage();
        }) ;
        
        // SearchSelector
        var inputSearchSelector = scannerView.find('.template_SearchSelector')[0] ;
        inputSearchSelector.scanner = currentScanner ;
        currentScanner.inputSearchSelector = inputSearchSelector ;
        currentScanner.inputSearchSelector.value = currentScanner.SearchSelector ;
        $(currentScanner.inputSearchSelector).on("change keyup",function()   // change paste keyup
        {
            this.scanner.SearchSelector = $(this).val() ;
            backgroundPage.saveStorage();
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
            this.scanner.ArraySelector = $(this).val() ;
            backgroundPage.saveStorage();
        }) ;
        
        // Enabled
        var inputEnabled = scannerView.find('.template_Enabled')[0] ;
        inputEnabled.scanner = currentScanner ;
        currentScanner.inputEnabled = inputEnabled ;
        $(currentScanner.inputEnabled).prop('checked',currentScanner.Enabled) ;
        $(currentScanner.inputEnabled).on("change keyup",function()   // change paste keyup
        {
            this.scanner.Enabled = $(this).prop('checked');
            backgroundPage.saveStorage();
        }) ;
        
        // Validated
        var inputValidated = scannerView.find('.template_Validated')[0] ;
        inputValidated.scanner = currentScanner ;
        currentScanner.inputValidated = inputValidated ;
        $(currentScanner.inputValidated).prop('checked',currentScanner.Validated) ;
        $(currentScanner.inputValidated).on("change keyup",function()   // change paste keyup
        {
            this.scanner.Validated = $(this).prop('checked');
            backgroundPage.saveStorage();
        }) ;
        
        // Hash  
        var inputChecksum = scannerView.find('.template_Checksum')[0] ;
        inputChecksum.scanner = inputChecksum ;
        currentScanner.inputChecksum = inputChecksum ;
        var hashToDisplay = currentScanner.newHash ;
        if (currentScanner.Hash !== -1 && currentScanner.Hash !== currentScanner.newHash)
            hashToDisplay = "Updated to" + hashToDisplay ;
        currentScanner.inputChecksum.innerText = hashToDisplay ;        
        
        // CheckTime
        var inputCheckTime = scannerView.find('.template_CheckTime')[0] ;
        inputCheckTime.scanner = inputCheckTime ;
        currentScanner.inputCheckTime = inputCheckTime ;
        var CheckTime = currentScanner.CheckTime;
        if (CheckTime == null)
            CheckTime = "" ;
        currentScanner.inputCheckTime.innerText = CheckTime ;              
        
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
          
          if (searchResults.length !== 0)
          {
              var index = searchResults.length-1  ;   // TODO : use onLoadScanner.searchPosition
              var lastSearchResult = searchResults[index] ;
              onLoadScanner.resultString = lastSearchResult.outerHTML           // view model : resultString
                  //.replace(/</g, '&lt;')
                  //.replace(/>/g, '&gt;')
                  //.replace(/&/g, '&amp;')
                  //.replace(/"/g, '&quot;')
                  ;       
              onLoadScanner.newHash = onLoadScanner.resultString.hashCode() ;   // view model : newHash                
          } else {
              onLoadScanner.resultString  = "Nothing !";                        // view model : resultString
          }           

          onLoadScanner.inputResult.innerText = onLoadScanner.resultString ;    // view : result
          
          var hashToDisplay = onLoadScanner.newHash ;
          if (onLoadScanner.Hash !== -1 && onLoadScanner.Hash !== onLoadScanner.newHash)
              hashToDisplay = "Updated to" + hashToDisplay ;
          onLoadScanner.inputChecksum.innerText = hashToDisplay;                // view : hash          
          
          onLoadScanner.Hash = onLoadScanner.newHash ;                          // view model : hash
          
          var d = new Date ;
          var dformat = [ d.getFullYear(),
                         (d.getMonth()+1).padLeft(),
                          d.getDate().padLeft()
                        ].join('/')+ ' ' +
                        [ d.getHours().padLeft(),
                          d.getMinutes().padLeft(),
                          d.getSeconds().padLeft()
                        ].join(':');
          
          
          onLoadScanner.CheckTime = Date() ;                                    // view model : CheckTime
          onLoadScanner.inputCheckTime.innerText = onLoadScanner.CheckTime ;    // view : CheckTime

          // save model
          scannedCount++ ;
          if (scannedCount == backgroundPage.scannerList.length || specificScanner != null)
              backgroundPage.saveStorage(backgroundPage) ;                            
          
        } ;       
        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        xhr.send(null);                     // fire onload
    }   
}

Number.prototype.padLeft = function(base,chr)
{
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}

String.prototype.hashCode = function()
{
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
