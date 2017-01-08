
function init() 
{
    var backgroundPage = chrome.extension.getBackgroundPage() ;
    var ttrace = backgroundPage.ttrace ;
    console.log("popup init. ttrace.host : " + ttrace.host) ;   
    ttrace.debug.send("popup init " );

    
    $(document).ready(function() 
    {
        $("#check_request_button").click(function(){
           backgroundPage.doRequest();
        }); 
        
        $("#init_storage_button").click(function () {
           backgroundPage.initStorage();
        });
        
        // scanner table list View is already created in background and stored in backgroundPage.resultTable.
        $("#response_body").append (backgroundPage.resultTable) ;
    });
}


init();


