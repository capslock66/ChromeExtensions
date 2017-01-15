
var scannerList = [] ;          // array of scanner
var pollInterval = 1000 * 600;  // poll interval : 600 sec (10 minutes)
var timerId ;                   // poll interval timer
var resultTable;                // jquery for scannerList_table element

// used by doRequest, requestCallBack
var toScanCount ;               // number of csanner to check
var scannedCount ;              // number of scanner already checked
var needToBeSaved;              // flag indicate if the scanner list need to be saved after all scan
var ttrace;                     // tracetool library

// JQuery is needed by requestCallback to parse result
// Tracetool is defined only on background 

requirejs(["../components/jquery/jquery.min"], function (jquery)
{
    console.log("jquery loaded",jquery);
    requirejs(["../components/tracetool/tracetool"], function (tracetool)
    {
        ttrace = tracetool.ttrace;
        console.log("tracetool loaded", tracetool);
        backgroundInit();
    });
});

function backgroundInit()
{
    console.log("backgroundInit start");
    this.ttrace = ttrace ;
    ttrace.host = "localHost:85";
    ttrace.debug.send("background init");

    // ReSharper disable once UseOfImplicitGlobalInFunctionScope
    chrome.storage.sync.get("scannerList", function (obj) 
    { 
       scannerList = obj.scannerList;
       //console.log("get storage done : scanners : \n" , scannerList) ;
       timerId = window.setTimeout(startRequest, pollInterval);
       countUnValided();
    }) ; 

    console.log("backgroundInit end");
}

// save scanner list
function saveStorage()
{
   ttrace.debug.send("saveStorage");
    // create a copy of the scannerList to save only needed fields
    var scannerCopyList = [] ;
    for (let i = 0; i < scannerList.length;i++)
    {
        var scanner = scannerList[i] ;
        var scannerCopy = {} ;
        scannerCopy.Name            = scanner.Name ;
        scannerCopy.ArraySelector   = scanner.ArraySelector ;
        scannerCopy.Enabled         = scanner.Enabled ;
        scannerCopy.Validated       = scanner.Validated ;
        scannerCopy.Site            = scanner.Site ;
        scannerCopy.SearchSelector  = scanner.SearchSelector ; 
        scannerCopy.Hash            = scanner.Hash ;
        scannerCopy.CheckTime       = scanner.CheckTime;
        scannerCopy.PollingInterval = scanner.PollingInterval;
        scannerCopyList.push(scannerCopy);        
    }
    
    // ReSharper disable once UseOfImplicitGlobalInFunctionScope
    chrome.storage.sync.set({'scannerList': scannerCopyList}, function () 
    {
        //console.log("saveStorage done") ;
        //ttrace.debug.send("saveStorage done") ; 
    }) ;                             
}

// called when poll interval is done
function startRequest() 
{
    doRequest();
    timerId = window.setTimeout(startRequest, pollInterval);
}

// stop polling 
function stopRequest() 
{
    window.clearTimeout(timerId);
}

function countUnValided() {
    var unvalidatedScanner = 0;
    for (let k = 0; k < scannerList.length; k++) {
        var checkScanner = scannerList[k];
        if (checkScanner.Validated === false && checkScanner.Enabled === true)
            unvalidatedScanner++;
    }
    if (unvalidatedScanner === 0) {
        // ReSharper disable once UseOfImplicitGlobalInFunctionScope
        chrome.browserAction.setBadgeText({ text: "" });
    } else {
        // ReSharper disable once UseOfImplicitGlobalInFunctionScope
        chrome.browserAction.setBadgeText({ text: "" + unvalidatedScanner });
    }
}

// callback is called by XMLHttpRequest.OnLoad
// callback use theses 3 vars : toScanCount, scannedCount, needToBeSaved 

// progressEvent.currentTarget : XMLHttpRequest
// progressEvent.currentTarget.responseURL
function requestCallBack (progressEvent)
{
    var request = progressEvent.currentTarget ;
    var scanner = progressEvent.currentTarget.scanner ;
    
    $(scanner.scannerView).attr('class', 'scanner_div_ok');

    // create an empty element, not stored in the document
    var newDivElement = $('<div></div>' );
  
    // Parse the XMLHttpRequest result into the new element
    newDivElement.html(request.responseText);
          
    // search key in new element
    var searchResult ;
    var searchResults = $(scanner.SearchSelector, newDivElement);  
    scanner.newHash = 0 ;  
    
    if (searchResults.length !== 0)
    {
        var arraySelector = Number(scanner.ArraySelector) ;
        
        if (searchResults.length === 1)
            scanner.resultString = "1 result" ;
        else
            scanner.resultString = "" + searchResults.length + " results. Specify Array Selection " ;
        
        for (var j = 0; j < searchResults.length; j++  )
        {
           // limit the number of result : take first 3 , the user chose (arraySelector) and the last one
            if (j < 3 || j === arraySelector || j === searchResults.length-1 )                
                scanner.resultString = scanner.resultString + "\n" + "[" + j + "]" + searchResults[j].outerHTML ;
            else if (j === 3)
                scanner.resultString = scanner.resultString + "\n" + "..." ;
        }
          
        if (arraySelector === -1) 
        {
            // take last
            var index = searchResults.length-1  ;  
            searchResult = searchResults[index].outerHTML ;                                        
        } else if (arraySelector === -2) { 
            // use count as a result
            searchResult = "" + searchResults.length ;
        } else {
            // take the position
            if (arraySelector < 0 || arraySelector >= searchResults.length)
            {
                searchResult = "Out of range" ;
                scanner.resultString = scanner.resultString + "\n" + arraySelector + " : Out of range" ;
            } else {
                searchResult = searchResults[arraySelector].outerHTML  ;
            }
        }  
    } else {
        searchResult = "Nothing !"; 
        scanner.resultString  = "Nothing !";                        // view model : resultString
    }           
  
    scanner.newHash = hashCode(searchResult) ;   // view model : newHash                
    
    var hashToDisplay = scanner.newHash ;
    if (scanner.Hash !== -1 && scanner.Hash !== scanner.newHash)
    {
        scanner.Validated = false;
        if (scanner.inputValidated !== undefined)
            $(scanner.inputValidated).prop('checked',false) ;              
        hashToDisplay = "" + scanner.newHash ;
        scanner.resultString = scanner.resultString + "\n" + "Page changed !!!" ;
        needToBeSaved = true ;
    }

    if (scanner.inputChecksum !== undefined)
        scanner.inputChecksum.innerText = hashToDisplay;                // view : hash     

    if (scanner.inputResult !== undefined)
        scanner.inputResult.innerText = scanner.resultString;     // view : result
    
    scanner.Hash = scanner.newHash ;                          // view model : hash
    
    afterScan(scanner);
}

// progressEvent.currentTarget : XMLHttpRequest
// progressEvent.currentTarget.responseURL
function requestOnError(progressEvent)
{
   //ttrace.debug.sendValue("xhr.onerror progressEvent", progressEvent);

   var request = progressEvent.currentTarget;
   var scanner = request.scanner;

   $(scanner.scannerView).attr('class', 'scanner_div_err');

   if (scanner.inputChecksum !== undefined)
      scanner.inputChecksum.innerText = "" ;                // view : hash     

   if (scanner.inputResult !== undefined)
      scanner.inputResult.innerText = "Error loading page !";     // view : result

   scanner.Validated = false;
   needToBeSaved = true;
   if (scanner.inputValidated !== undefined)
      $(scanner.inputValidated).prop('checked', false);
   afterScan(scanner);
}

function afterScan(scanner)
{
   var d = new Date();
   var dformat = [d.getFullYear(),
                  padLeft(d.getMonth() + 1),
                  padLeft(d.getDate())
   ].join('/') + ' ' +
                 [padLeft(d.getHours()),
                   padLeft(d.getMinutes()),
                   padLeft(d.getSeconds())
                 ].join(':');


   scanner.CheckTime = dformat;                                   // view model : CheckTime
   if (scanner.inputCheckTime !== undefined)
      scanner.inputCheckTime.innerText = scanner.CheckTime;    // view : CheckTime

   // save model
   scannedCount++;
   if (scannedCount === toScanCount)   // || specificScanner !== undefined
   {
      if (needToBeSaved)
         saveStorage();
      // display number of unvalidated (and enabled) scanner 
      countUnValided();
   }

}

// progressEvent.currentTarget : XMLHttpRequest
// progressEvent.currentTarget.responseURL

//function requestOnreadystatechange(event)
//{
//   var request = event.currentTarget;
//   var scanner = request.scanner;
//   ttrace.debug.sendValue("xhr.onreadystatechange event", event);
//   if (request.readyState === 4) {   //if complete
//      if (request.status === 200) {  //check if "OK" (200)
//         //success
//      } else {
//         if (scanner.inputResult !== undefined)
//            scanner.inputResult.innerText += "error " + request.status;     // view : result
//      }
//   }
//}


// Check all scanners or a specific one.
// Asynchrone. requestCallBack will be called for each one
function doRequest(specificScanner)
{
    console.log("doRequest") ;
    //ttrace.debug.send("doRequest");

    toScanCount = scannerList.length ;
    if (specificScanner !== undefined)
        toScanCount = 1 ;    
    
    scannedCount = 0 ;
    needToBeSaved = false ;
    for (let i = 0; i < scannerList.length; i++)
    {
        var currentScanner = scannerList[i] ;
        if (specificScanner !== undefined && currentScanner !== specificScanner)
            continue ; 
        
        // if specific scanner is used, don't check for enabled
        if (specificScanner === undefined && currentScanner.Enabled === false)
        {
            toScanCount-- ;
            continue ; 
        }        
        if (currentScanner.inputResult !== undefined)
            currentScanner.inputResult.innerText = "";     // view : result

        currentScanner.index = i ;
        var url = currentScanner.Site ;
        // ReSharper disable once InconsistentNaming
        var xhr = new XMLHttpRequest();
        xhr.scanner = currentScanner ; // save to xhr for later retreival (onload callback) 

        //xhr.onreadystatechange = requestOnreadystatechange;
        xhr.onerror = requestOnError;
        xhr.onload = requestCallBack;

        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        xhr.send(null);                     // fire onload

    }   
}

// test purpose.
// TODO : remove
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
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "CodeProject - Port Forwarding" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.codeproject.com/Articles/191930/Android-Usb-Port-Forwarding";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "CodeProject - AidaNet" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.codeproject.com/Articles/6009/AidaNet-Network-resources-inventory";
    scanner.SearchSelector = "#ctl00_ArticleTabs_CmtCnt" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = " Xda - Reverse Tethering -Q&A" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "http://forum.xda-developers.com/android/help/qa-android-reverse-tethering-3-19-t2908241/page3000";
    scanner.SearchSelector = ".postCount" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "Xda - Reverse Tethering - Discussion" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "http://forum.xda-developers.com/showthread.php?t=1371345&page=3000";
    scanner.SearchSelector = ".postCount" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - Does the Silverlight/WPF Dxgrid take the icon into consideration when calculating BestFit" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.devexpress.com/Support/Center/Question/Details/T166379";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - How to show a child ExpandoObjects in TreeListControl" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.devexpress.com/support/center/Question/Details/T450669";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    scanner = {};
    scanner.Name = "DevExpress - The error icon's width isn't taken into account when the BestFit operation is calculated" ;
    scanner.ArraySelector = -1 ;  // 0 = first, n , -1 = last, -2 = use result array count as hash
    scanner.Enabled = true ;
    scanner.Validated = true ;
    scanner.Site = "https://www.devexpress.com/Support/Center/Question/Details/T455210";
    scanner.SearchSelector = "#question-modified-on" ;
    scanner.Hash = -1 ;
    scanner.CheckTime = 0 ;
    scannerList.push(scanner);
    
    console.log ("save all scanner") ;
     // ReSharper disable once UseOfImplicitGlobalInFunctionScope
    chrome.storage.sync.set({'scannerList': scannerList}, function () //obj
    {
        //console.log("initStorage done") ;
        //ttrace.debug.send("initStorage done") ; 
    }) ;         
}

// Helper
function padLeft (src,base,chr)
{
   var len = (String(base || 10).length - String(src).length) + 1;
   var result = len > 0 ? new Array(len).join(chr || '0') + src : src;
   return result ;
};

// Helper
function hashCode (src)
{
    if (Array.prototype.reduce){
       return src.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    } 
    var hash = 0;
    if (src.length === 0) return hash;
    for (var i = 0; i < src.length; i++) {
        var character = src.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
} ;


