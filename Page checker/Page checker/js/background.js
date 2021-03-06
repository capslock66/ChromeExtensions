// "View Model" extension

var currentPopup = null;         // displayed popup (can be null of no popup)
var scannerList = [];            // array of scanner
var scannerNextId;
var pollInterval = 1000 * 3;     // poll interval 
var timerId ;                    // poll interval timer

// used by CheckScanners, requestCallBack
var totalScannedCount = 0 ;       // number of scan performed
var needToBeSaved = false ;       // flag indicate if the scanner list need to be saved after all scan

// libraries (jquery add itself to global)
var ttrace = null ;                    
var moment = null ;

// JQuery is needed by requestCallback to parse result
// Tracetool is defined only on background 

requirejs(["../components/jquery.min"], function ()
{
    requirejs(["../components/moment.min"], function (mo)
    {
        moment = mo;
        requirejs(["../components/tracetool"], function (tracetool)
        {
            ttrace = tracetool.ttrace;
            console.log("tracetool loaded", tracetool);
            backgroundInit();
        });
    });
});

function backgroundInit()
{
    console.log("backgroundInit start");
    this.ttrace = ttrace ;
    ttrace.host = "localHost:85";
    //ttrace.debug.send("background init");

    // ReSharper disable once UseOfImplicitGlobalInFunctionScope
    chrome.storage.sync.get("scannerList", function (obj) 
    {
       // scannerList is the "Model"
       scannerList = obj.scannerList;           // length = 10 : 0..9
       if (scannerList === undefined)
           scannerList = [];

       for (var i = 0; i < scannerList.length; i++)
       {
           var scanner = scannerList[i];
           if (scanner.ParsingMethod === undefined)
               scanner.ParsingMethod = "OuterHTML";
           if (scanner.UpdateTime === undefined)
               scanner.UpdateTime = "";

           scanner.id = "scannerTr" + i;
           scanner.resultResume = "";
       }
       scannerNextId = scannerList.length;      // next id : 10

       //console.log("get storage done : scanners : \n" , scannerList) ;
       timerId = window.setTimeout(startRequest, pollInterval);
       nextScanTime();
    }) ; 

    console.log("backgroundInit end");
}

// save scanner list
function saveStorage()
{
   //ttrace.debug.send("saveStorage");
    // create a copy of the scannerList to save only needed fields => Model
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
        scannerCopy.ParsingMethod   = scanner.ParsingMethod ;
        scannerCopy.Hash            = scanner.Hash ;
        scannerCopy.CheckTime       = scanner.CheckTime;
        scannerCopy.UpdateTime      = scanner.UpdateTime ;
        scannerCopy.PollingInterval = scanner.PollingInterval;
        scannerCopy.Collapsed       = scanner.Collapsed;
        scannerCopy.IsError         = scanner.IsError;
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
    CheckScanners(null, false);
    timerId = window.setTimeout(startRequest, pollInterval);
}

// stop polling 
function stopRequest() 
{
    window.clearTimeout(timerId);
}

/* 
 * @param {} progressEvent 
 * @returns {} 
 */
// callback is called by XMLHttpRequest.OnLoad

// progressEvent.currentTarget : XMLHttpRequest
// progressEvent.currentTarget.responseURL
function requestCallBack (progressEvent)
{
    //console.log("requestCallBack");

    var request = progressEvent.currentTarget ;
    var scanner = progressEvent.currentTarget.scanner;

    // if page was previously in error (then unvalidated automatically), revalidate it.
    if (scanner.isError)
    {
        scanner.isError = false;
        scanner.Validated = true;
    }
    
    $(scanner.scannerView).attr('class', 'scanner_div_ok');

    // create an empty element, not stored in the document
    var newDivElement = $('<div></div>' );
  
    // Parse the XMLHttpRequest result into the new element
    newDivElement.html(request.responseText);
          
    // search key in new element
    var searchResult;
    var searchResults;

    if (scanner.SearchSelector === '')
        searchResults = newDivElement;
    else {
        try { 
            searchResults = $(scanner.SearchSelector, newDivElement);
        } catch(e) { 
            scanner.resultString = e.toString();
            scanner.newHash = "" ;
            scanner.Validated = false;
            scanner.isError = true;
            scanner.resultResume = "Error";
            afterScan(scanner);
            return ;
        }
    }
    scanner.newHash = 0 ;  

    if (searchResults.length !== 0)
    {
        var arraySelector = Number(scanner.ArraySelector) ;
        
        scanner.resultResume = " : " + searchResults.length + " result(s)";

        //if (searchResults.length === 1)
        //    scanner.resultString = "1 result" ;
        //else
        //    scanner.resultString = "" + searchResults.length + " results. Specify Array Selection " ;
        scanner.resultString = "";
        
        for (var j = 0; j < searchResults.length; j++  )
        {
            if (j > 0 && j < 3)
               scanner.resultString = scanner.resultString + "\n";
            // limit the number of result : take first 3 , the user chose (arraySelector) and the last one
            if (j < 3 || j === arraySelector || j === searchResults.length-1 )                
                scanner.resultString = scanner.resultString + "[" + j + "]" + convertSearchResult(scanner,searchResults[j]);
            else if (j === 3)
                scanner.resultString = scanner.resultString + "\n" + "..." + "\n";
        }
          
        if (arraySelector === -1) 
        {
            // take last
            var index = searchResults.length-1  ;  
            searchResult = convertSearchResult(scanner,searchResults[index]);
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
                searchResult = convertSearchResult(scanner,searchResults[arraySelector]);
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
        // if manual check, don't unvalidate
        if (request.isManualCheck === false)
          scanner.Validated = false;

        var dformat = moment().format("YYYY/MM/DD HH:mm:ss");
        scanner.UpdateTime = dformat;               

        hashToDisplay = "" + scanner.newHash ;
        scanner.resultResume = scanner.resultResume + ", Page changed !!!";
        needToBeSaved = true ;
    }
    scanner.Hash = scanner.newHash ;             // view model :  Hash           
    afterScan(scanner);
}

function convertSearchResult(scanner, searchResult)
{
    if (scanner.ParsingMethod === "InnerHTML")
        return searchResult.innerHTML;
    if (scanner.ParsingMethod === "OuterHTML")
        return searchResult.outerHTML;

    if (scanner.ParsingMethod === "AllText")
        return $(searchResult).text();

    if (scanner.ParsingMethod === "MainText")
    {
        return $(searchResult)
            .clone()    // clone the element
            .children() // select all the children
            .remove()   // remove all the children
            .end()      // go back to selected element
            .text();
    }
    return searchResult.outerHTML;
}

// progressEvent.currentTarget : XMLHttpRequest
// progressEvent.currentTarget.responseURL
function requestOnError(progressEvent)
{
   //ttrace.error.sendValue("xhr.onerror progressEvent", progressEvent);
   needToBeSaved = true;

   var request = progressEvent.currentTarget;
   var scanner = request.scanner;

   scanner.resultString = "Error loading page !";
   scanner.newHash = "" ;
   scanner.Validated = false;
   scanner.isError = true;
   afterScan(scanner);
}

function afterScan(scanner)
{
    var dformat = moment().format("YYYY/MM/DD HH:mm:ss");
    scanner.CheckTime = dformat;                // view model : CheckTime
    scanner.IsScanning = false;

    if (scanner.UpdateTime === undefined)
       scanner.UpdateTime = dformat;

    var run = runningCount();
    console.log("afterScan. Scanned running :  " + run + ", name : " + scanner.Name);
 
    if (currentPopup !== null)
        currentPopup.SetScannerClass(scanner);
 
    if (runningCount() === 0)  
    {
        if (needToBeSaved)
            saveStorage();
 
        // display number of unvalidated (and enabled) scanner
        nextScanTime();
        if (currentPopup !== null)
            currentPopup.RefreshView(); // refresh selected Scanner
    }
} 

function runningCount()
{
    var result = 0 ;
    for (let k = 0; k < scannerList.length; k++) 
    {
        var checkScanner = scannerList[k];
        if (checkScanner.IsScanning === true)
            result++;
    }
    return result;
}

function nextScanTime()
{
   var diffFormat;
   var now = moment();
   //console.log("now " + now.format("YYYY/MM/DD HH:mm:ss"));
   var lowerDiff = -1;
   var isFirst = true;

   var unvalidatedScanner = 0;
   for (let k = 0; k < scannerList.length; k++)
   {
      var checkScanner = scannerList[k];
      if (checkScanner.Enabled === false)
         continue;

      if (checkScanner.Validated === false)
         unvalidatedScanner++;

      var m = moment(checkScanner.CheckTime, "YYYY/MM/DD HH:mm:ss");
      m.add(checkScanner.PollingInterval, 'minutes');
      var ms = m.diff(now); // http://momentjs.com/docs/#/displaying/difference

      if (isFirst === true) {
         isFirst = false;
         lowerDiff = ms;
      }  else if (ms < lowerDiff)
         lowerDiff = ms;
   }

   if (unvalidatedScanner === 0) {
      // ReSharper disable once UseOfImplicitGlobalInFunctionScope
      chrome.browserAction.setBadgeText({ text: "" });
   } else {
      // ReSharper disable once UseOfImplicitGlobalInFunctionScope
      chrome.browserAction.setBadgeText({ text: "" + unvalidatedScanner });
   }

   if (isFirst === true)
      chrome.browserAction.setTitle({ title: "Next scan : Not scheduled" });
   else {
      diffFormat = moment.utc(lowerDiff).format("HH:mm:ss");
      //console.log("Next scan in " + diffFormat);
      chrome.browserAction.setTitle({
         title:
            "Next scan in " + diffFormat + "\n" +
            "Total scanned page count : " + totalScannedCount + "\n" +
            "Not validated page count : " + unvalidatedScanner +"\n" + 
            "Waiting : " + runningCount()
      });
   }
}




// Check all scanners or a specific one.
// Asynchrone. requestCallBack or requestOnError will be called for each one
function CheckScanners(specificScanner, ignoreTime)
{
    //ttrace.debug.send("CheckScanners");

    var toScanCount = 0 ;    
    
    needToBeSaved = false ;
    for (let i = 0; i < scannerList.length; i++)
    {
        var scanner = scannerList[i];

        scanner.IsScanning = false;
        
        if (specificScanner !== null && scanner !== specificScanner)
            continue ; 
        
        // if specific scanner is used, don't check for enabled
        if (specificScanner === null && scanner.Enabled === false)
           continue;

        if (specificScanner === null && ignoreTime === false)
        {
            // compare last checktime with polling interval
           if (scanner.CheckTime === undefined)
              scanner.CheckTime = moment().format("YYYY/MM/DD HH:mm:ss");

           if (scanner.PollingInterval === undefined)
              scanner.PollingInterval = 60;

            var m = moment(scanner.CheckTime, "YYYY/MM/DD HH:mm:ss");
            m.add(scanner.PollingInterval, 'minutes');
            if (m.isAfter(moment())) 
               continue;
        }

        if (currentPopup !== null)
            $(scanner.anchor).addClass('scanner_scanning');

        scanner.IsScanning = true;
        //scanner.isError = false;      // keep error

        var url = scanner.Site;
        // ReSharper disable once InconsistentNaming
        var xhr = new XMLHttpRequest();
        xhr.scanner = scanner; // save to xhr for later retreival (onload callback) 


        //console.log("CheckScanner " + scanner.id);

        if (scanner === specificScanner || ignoreTime === true)
            xhr.isManualCheck = true;
        else
            xhr.isManualCheck = false;

        totalScannedCount++;   // total number of page scanned
        toScanCount++;
        xhr.onerror = requestOnError;
        xhr.onload = requestCallBack;

        xhr.open("GET", url, true);         // xhrReq.open(method, url, async, user, password); 
        try {
            xhr.send(null);                     // fire onload
        } catch (e) {
            // eat exception
        }
    }   
    if (toScanCount === 0)
       nextScanTime();    
 }

// Helper
function padLeft (src,base,chr)
{
   var len = String(base || 10).length - String(src).length + 1;
   var result = len > 0 ? new Array(len).join(chr || "0") + src : src;
   return result ;
}

// Helper
function hashCode (src)
{
    if (Array.prototype.reduce){
       return src.split("").reduce(function (a, b) { a = (a << 5) - a + b.charCodeAt(0); return a & a; }, 0);
    } 
    var hash = 0;
    if (src.length === 0) return hash;
    for (var i = 0; i < src.length; i++) {
        var character = src.charCodeAt(i);
        hash  = (hash<<5)-hash+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
} 


