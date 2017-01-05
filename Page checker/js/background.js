
var scannerList = 111 ;

function main()
{
    console.log("background main start. ttrace.host : " + ttrace.host);
    this.ttrace = ttrace ;
    ttrace.host = "localHost:85";
    ttrace.debug.send("background init");

    //var BackgroundPage = chrome.extension.getBackgroundPage() ;
    chrome.storage.sync.get('scannerList', function (obj) 
    { 
       scannerList = obj.scannerList;
       console.log("storage get callback : scanners : \n" , scannerList) ; 
    }) ; 

    console.log("background main end. ttrace.host : " + ttrace.host);
}

main();
