
var scannerList = 111 ;

function main()
{
    console.log("background main start. ttrace.host : " + ttrace.host);
    this.ttrace = ttrace ;
    ttrace.host = "localHost:85";
    ttrace.debug.send("background init");

    chrome.storage.sync.get('scannerList', function (obj) 
    { 
       scannerList = obj.scannerList;
       console.log("get storage done : scanners : \n" , scannerList) ; 
    }) ; 

    console.log("background main end. ttrace.host : " + ttrace.host);
}

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
        console.log("saveStorage done") ;
        ttrace.debug.send("saveStorage done") ; 
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
        console.log("initStorage done") ;
        ttrace.debug.send("initStorage done") ; 
    }) ;         
}

main();
