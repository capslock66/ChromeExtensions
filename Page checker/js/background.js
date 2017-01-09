
var scannerList = [] ;          // array of scanner
var pollInterval = 1000 * 30;   // poll interval : 30 sec, in milliseconds
var timerId ;                   // poll interval timer
var resultTable;                // jquery for scannerList_table element

// used by doRequest, requestCallBack
var toScanCount ;               // number of csanner to check
var scannedCount ;              // number of scanner already checked
var needToBeSaved ;             // flag indicate if the scanner list need to be saved after all scan

function main()
{
    console.log("background main start" );
    this.ttrace = ttrace ;
    ttrace.host = "localHost:85";
    //ttrace.debug.send("background init");

    chrome.storage.sync.get('scannerList', function (obj) 
    { 
       scannerList = obj.scannerList;
       //console.log("get storage done : scanners : \n" , scannerList) ;
       fillScannerTable() ;
       timerId = window.setTimeout(startRequest, pollInterval);
    }) ; 

    console.log("background main end");
}

// called only one time when background is loaded
function fillScannerTable()
{
    //debugger;
    resultTable = $(".scannerList_table");  
   
    for (var i in scannerList) 
    {
        var currentScanner = scannerList[i] ;        
        var ScannerTr = fillScanner(currentScanner) ;
        resultTable.append(ScannerTr);        
    }
}

// called by fillScannerTable or when a new scanner is added
function fillScanner(currentScanner)
{
    var scannerTemplate = $('.scanner_div') ;
    var scannerView = scannerTemplate.clone().removeClass("scanner_div").addClass('scanner_div2');

    // Input name
    var inputName = scannerView.find('.template_Name')[0] ;
    inputName.scanner = currentScanner ;
    currentScanner.inputName = inputName ;
    currentScanner.inputName.value = currentScanner.Name ;
    $(currentScanner.inputName).on("change keyup",function()   // change paste keyup
    {
        this.scanner.Name = $(this).val() ;
        saveStorage();
    }) ;

    // Site
    var inputSite = scannerView.find('.template_Site')[0] ;
    inputSite.scanner = currentScanner ;
    currentScanner.inputSite = inputSite ;
    currentScanner.inputSite.value = currentScanner.Site ;
    $(currentScanner.inputSite).on("change keyup",function()   // change paste keyup
    {
        this.scanner.Site = $(this).val() ;
        saveStorage();
    }) ;
    
    // SearchSelector
    var inputSearchSelector = scannerView.find('.template_SearchSelector')[0] ;
    inputSearchSelector.scanner = currentScanner ;
    currentScanner.inputSearchSelector = inputSearchSelector ;
    currentScanner.inputSearchSelector.value = currentScanner.SearchSelector ;
    $(currentScanner.inputSearchSelector).on("change keyup",function()   // change paste keyup
    {
        this.scanner.SearchSelector = $(this).val() ;
        saveStorage();
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
    currentScanner.inputArraySelector = inputArraySelector ;
    currentScanner.inputArraySelector.value = currentScanner.ArraySelector ;
    $(currentScanner.inputArraySelector).on("change keyup",function()   // change paste keyup
    {
        this.scanner.ArraySelector = $(this).val() ;
        saveStorage();
    }) ;
    
    // Enabled
    var inputEnabled = scannerView.find('.template_Enabled')[0] ;
    inputEnabled.scanner = currentScanner ;
    currentScanner.inputEnabled = inputEnabled ;
    $(currentScanner.inputEnabled).prop('checked',currentScanner.Enabled) ;
    $(currentScanner.inputEnabled).on("change keyup",function()   // change paste keyup
    {
        this.scanner.Enabled = $(this).prop('checked');
        saveStorage();
    }) ;
    
    // Validated
    var inputValidated = scannerView.find('.template_Validated')[0] ;
    inputValidated.scanner = currentScanner ;
    currentScanner.inputValidated = inputValidated ;
    $(currentScanner.inputValidated).prop('checked',currentScanner.Validated) ;
    $(currentScanner.inputValidated).on("change keyup",function()   // change paste keyup
    {
        this.scanner.Validated = $(this).prop('checked');
        saveStorage();
    }) ;
    
    // Hash  
    var inputChecksum = scannerView.find('.template_Checksum')[0] ;
    inputChecksum.scanner = inputChecksum ;
    currentScanner.inputChecksum = inputChecksum ;
    var hashToDisplay = currentScanner.Hash ;
    if (currentScanner.newHash !== "undefined" && currentScanner.Hash !== currentScanner.newHash)
        hashToDisplay = "" + currentScanner.newHash ;
    currentScanner.inputChecksum.innerText = hashToDisplay ;        
    
    // CheckTime
    var inputCheckTime = scannerView.find('.template_CheckTime')[0] ;
    inputCheckTime.scanner = inputCheckTime ;
    currentScanner.inputCheckTime = inputCheckTime ;
    var CheckTime = currentScanner.CheckTime;
    if (CheckTime === null || CheckTime === undefined)
        CheckTime = "" ;
    currentScanner.inputCheckTime.innerText = CheckTime ;              
    
    var ScannerTr = $("<tr></tr>");
    var ScannerTd = $("<td></td>");
    ScannerTr.append(ScannerTd);
    ScannerTd.append(scannerView) ;
    return ScannerTr ;
}

// save scanner list
function saveStorage()
{
    // create a copy of the scannerList to save only needed fields
    var scannerCopyList = [] ;
    for (var i in scannerList) 
    {
        var scanner = scannerList[i] ;
        var scannerCopy = {} ;
        scannerCopy.Name           = scanner.Name ;
        scannerCopy.ArraySelector  = scanner.ArraySelector ;
        scannerCopy.Enabled        = scanner.Enabled ;
        scannerCopy.Validated      = scanner.Validated ;
        scannerCopy.Site           = scanner.Site ;
        scannerCopy.SearchSelector = scanner.SearchSelector ; 
        scannerCopy.Hash           = scanner.Hash ;
        scannerCopy.CheckTime      = scanner.CheckTime ;
        scannerCopyList.push(scannerCopy);        
    }
    
    chrome.storage.sync.set({'scannerList': scannerCopyList}, function (obj) 
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

// callback is called by XMLHttpRequest.OnLoad
// callback use theses 3 vars : toScanCount, scannedCount, needToBeSaved 
// parameter e : ProgressEvent
// e.currentTarget : XMLHttpRequest
// e.currentTarget.responseURL
function requestCallBack (e)
{
    var onloadRequest = e.currentTarget ;
    var onLoadScanner = e.currentTarget.scanner ;
    
    // create an empty element, not stored in the document
    var newDivElement = $('<div></div>' );
  
    // Parse the XMLHttpRequest result into the new element
    newDivElement.html(onloadRequest.responseText);
          
    // search key in new element
    var searchResult ;
    var searchResults = $(onLoadScanner.SearchSelector, newDivElement);  
    onLoadScanner.newHash = 0 ;  
    
    if (searchResults.length !== 0)
    {
        var ArraySelector = Number(onLoadScanner.ArraySelector) ;
        
        if (searchResults.length == 1)
            onLoadScanner.resultString = "1 result" ;
        else
            onLoadScanner.resultString = "" + searchResults.length + " results. Specify Array Selection " ;
        
        for (var j = 0; j < searchResults.length; j++  )
        {
            // print first 3 , the selected and the last one
            if (j < 3 || j === searchResults.length-1 || j === ArraySelector)                
                onLoadScanner.resultString = onLoadScanner.resultString + "\n" + "[" + j + "]" + searchResults[j].outerHTML ;
            else if (j === 3)
                onLoadScanner.resultString = onLoadScanner.resultString + "\n" + "..." ;
        }
          
        if (ArraySelector === -1) 
        {
            // take last
            var index = searchResults.length-1  ;  
            searchResult = searchResults[index].outerHTML ;                                        
        } else if (ArraySelector === -2) { 
            // use count as a result
            searchResult = "" + searchResults.length ;
        } else {
            // take the position
            if (ArraySelector < 0 || ArraySelector >= searchResults.length)
            {
                searchResult = "Out of range" ;
                onLoadScanner.resultString = onLoadScanner.resultString + "\n" + ArraySelector + " : Out of range" ;
            } else {
                searchResult = searchResults[ArraySelector].outerHTML  ;
            }
        }  
    } else {
        searchResult = "Nothing !"; 
        onLoadScanner.resultString  = "Nothing !";                        // view model : resultString
    }           
  
    onLoadScanner.newHash = searchResult.hashCode() ;   // view model : newHash                
    
    var hashToDisplay = onLoadScanner.newHash ;
    if (onLoadScanner.Hash !== -1 && onLoadScanner.Hash !== onLoadScanner.newHash)
    {
        onLoadScanner.Validated = false ;      
        $(onLoadScanner.inputValidated).prop('checked',false) ;              
        hashToDisplay = "" + onLoadScanner.newHash ;
        onLoadScanner.resultString = onLoadScanner.resultString + "\n" + "Page changed !!!" ;
        needToBeSaved = true ;
    }
    onLoadScanner.inputChecksum.innerText = hashToDisplay;                // view : hash          
    onLoadScanner.inputResult.innerText = onLoadScanner.resultString ;    // view : result
    
    onLoadScanner.Hash = onLoadScanner.newHash ;                          // view model : hash
    
    var d = new Date() ;
    var dformat = [ d.getFullYear(),
                   (d.getMonth()+1).padLeft(),
                    d.getDate().padLeft()
                  ].join('/')+ ' ' +
                  [ d.getHours().padLeft(),
                    d.getMinutes().padLeft(),
                    d.getSeconds().padLeft()
                  ].join(':');
    
    
    onLoadScanner.CheckTime = dformat ;                                   // view model : CheckTime
    onLoadScanner.inputCheckTime.innerText = onLoadScanner.CheckTime ;    // view : CheckTime
  
    // save model
    scannedCount++ ;
    if (scannedCount == toScanCount )   // || specificScanner !== undefined
    {
        if (needToBeSaved)  
            saveStorage() ;  
        // display number of unvalidated (and enabled) scanner 
        var unvalidatedScanner = 0 ;
        for (var k in scannerList) 
        {
            var checkScanner = scannerList[k] ;
            if (checkScanner.Validated === false && checkScanner.Enabled === true)
                unvalidatedScanner++ ;
        }
        if (unvalidatedScanner === 0)
            chrome.browserAction.setBadgeText({text:""});
        else
            chrome.browserAction.setBadgeText({text:""+unvalidatedScanner});
  
    }
}

// Check all scanners or a specific one.
// Asynchrone. requestCallBack will be called for each one
function doRequest(specificScanner)
{
    //console.log("doRequest") ;
    //ttrace.debug.send("doRequest");

    toScanCount = scannerList.length ;
    if (specificScanner !== undefined)
        toScanCount = 1 ;    
    
    scannedCount = 0 ;
    needToBeSaved = false ;
    for (var i in scannerList) 
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
        
        currentScanner.index = i ;
        var url = currentScanner.Site ;
        var xhr = new XMLHttpRequest();
        xhr.scanner = currentScanner ; // save to xhr for later retreival (onload callback) 

        xhr.onload = requestCallBack ;
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
    chrome.storage.sync.set({'scannerList': scannerList}, function (obj) 
    {
        //console.log("initStorage done") ;
        //ttrace.debug.send("initStorage done") ; 
    }) ;         
}

// Helper
Number.prototype.padLeft = function(base,chr)
{
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
};

// Helper
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

main();
