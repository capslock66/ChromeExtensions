var ttrace ;
var resultTable;                // jquery for scannerList_table element
var backgroundPage;
var chrome;                     // remove warning about undeclared chrome var

// tracetool is not loaded. We can use backgroundPage.ttrace
// jquery is needed to generate popup scanner list
requirejs(["../components/jquery/jquery.min"], function (jquery) {
    popupInit();
});


function popupInit()
{
    // ReSharper disable once UseOfImplicitGlobalInFunctionScope
    backgroundPage = chrome.extension.getBackgroundPage() ;
    ttrace = backgroundPage.ttrace;

   // don't use the popup console (can de destroyed). Use the backgroundPage console
    backgroundPage.console.log("popup init");
    //ttrace.debug.send("popup init " );
    
    $(document).ready(function() 
    {
        $("#check_request_button").click(function ()
        {
            backgroundPage.doRequest();
        }); 
         
        $("#init_storage_button").click(function ()
        {
            backgroundPage.initStorage();
        });

        $("#add_page_button").click(function () {
            AddCurrentPage();
        });

        addEventListener("unload", function (event)
        {
           backgroundPage.console.log(event.type);
        }, true);

        fillScannerTable();
    });
}

function AddCurrentPage()
{
    // https://developer.chrome.com/extensions/tabs#method-query

    // note that if the debugger for the popup is opened, this is not the lastFocusedWindow
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs)
    {
        debugger;   // while the debugger is opened and paused, click now on the page and try again. The lastFocusedWindows will be again ok

        if (tabs.length === 0) 
            return ;
        var url = tabs[0].url;
        backgroundPage.console.log("current page : ", url);

        resultTable = $(".scannerList_table");
        var scanner = {};

        scanner.Name = tabs[0].title;
        scanner.ArraySelector = -1;  // 0 = first, n , -1 = last, -2 = use result array count as hash
        scanner.Enabled = true;
        scanner.Validated = true;
        scanner.Site = tabs[0].url;
        scanner.SearchSelector = "Body";
        scanner.Hash = -1;
        scanner.CheckTime = 10;
        backgroundPage.scannerList.push(scanner);

        var scannerTr = CloneScannerTemplate(scanner);
        SetScannerEvents(scanner);
        resultTable.append(scannerTr);

        backgroundPage.saveStorage();

    });
}


function fillScannerTable()
{
    //var responseBody = $("#response_body");
    resultTable = $(".scannerList_table");
 
    for (let i = 0; i < backgroundPage.scannerList.length; i++)
    {
        var currentScanner = backgroundPage.scannerList[i];
        var scannerTr = CloneScannerTemplate(currentScanner);
        SetScannerEvents(currentScanner);
        resultTable.append(scannerTr);
    }
    //responseBody.append(resultTable);
}

// called by fillScannerTable or when a new scanner is added
function CloneScannerTemplate(currentScanner)
{
   var scannerTemplate = $(".scanner_div");
   // ReSharper disable once UnknownCssClass
   var scannerView = scannerTemplate.clone().removeClass("scanner_div").addClass("scanner_div2");

   // Name : Edit
   var inputName = scannerView.find(".template_Name")[0];
   inputName.scanner = currentScanner;
   currentScanner.inputName = inputName;
   currentScanner.inputName.value = currentScanner.Name;

   // Site : Edit
   var inputSite = scannerView.find(".template_Site")[0];
   inputSite.scanner = currentScanner;
   currentScanner.inputSite = inputSite;
   currentScanner.inputSite.value = currentScanner.Site;

   // SearchSelector : Edit
   var inputSearchSelector = scannerView.find(".template_SearchSelector")[0];
   inputSearchSelector.scanner = currentScanner;
   currentScanner.inputSearchSelector = inputSearchSelector;
   currentScanner.inputSearchSelector.value = currentScanner.SearchSelector;

   // CheckNow : Button
   var inputCheckNow = scannerView.find(".template_CheckNow")[0];
   inputCheckNow.scanner = currentScanner;
   currentScanner.inputCheckNow = inputCheckNow;

    // Open : Button
   var inputOpen = scannerView.find(".template_Open")[0];
   inputOpen.scanner = currentScanner;
   currentScanner.inputOpen = inputOpen;

    // Delete : Button
   var inputDelete = scannerView.find(".template_Delete")[0];
   inputDelete.scanner = currentScanner;
   currentScanner.inputDelete = inputDelete;

   // Result : Text
   var inputResult = scannerView.find(".template_Result")[0];
   inputResult.scanner = currentScanner;
   currentScanner.inputResult = inputResult;
   currentScanner.inputResult.innerText = "";

   // ArraySelector : Edit
   var inputArraySelector = scannerView.find(".template_ArraySelector")[0];
   inputArraySelector.scanner = currentScanner;
   currentScanner.inputArraySelector = inputArraySelector;
   currentScanner.inputArraySelector.value = currentScanner.ArraySelector;

    // PollingInterval : Edit
   var inputPollingInterval = scannerView.find(".template_PollingInterval")[0];
   inputPollingInterval.scanner = currentScanner;
   if (inputPollingInterval === undefined)
       inputPollingInterval = 1;
   currentScanner.inputPollingInterval = inputPollingInterval;
   currentScanner.inputPollingInterval.value = currentScanner.PollingInterval;

    // Enabled : Checkbox
   var inputEnabled = scannerView.find(".template_Enabled")[0];
   inputEnabled.scanner = currentScanner;
   currentScanner.inputEnabled = inputEnabled;
   $(currentScanner.inputEnabled).prop("checked", currentScanner.Enabled);

   // Validated : Checkbox
   var inputValidated = scannerView.find(".template_Validated")[0];
   inputValidated.scanner = currentScanner;
   currentScanner.inputValidated = inputValidated;
   $(currentScanner.inputValidated).prop("checked", currentScanner.Validated);

   // Hash : Text
   var inputChecksum = scannerView.find(".template_Checksum")[0];
   inputChecksum.scanner = inputChecksum;
   currentScanner.inputChecksum = inputChecksum;
   var hashToDisplay = currentScanner.Hash;
   if (currentScanner.newHash !== "undefined" && currentScanner.Hash !== currentScanner.newHash)
      hashToDisplay = "" + currentScanner.newHash;
   currentScanner.inputChecksum.innerText = hashToDisplay;

   // CheckTime : Text
   var inputCheckTime = scannerView.find(".template_CheckTime")[0];
   inputCheckTime.scanner = inputCheckTime;
   currentScanner.inputCheckTime = inputCheckTime;
   var checkTime = currentScanner.CheckTime;
   if (checkTime === null || checkTime === undefined)
      checkTime = "";
   currentScanner.inputCheckTime.innerText = checkTime;

   var scannerTr = $("<tr></tr>");
   var scannerTd = $("<td></td>");
   scannerTr.append(scannerTd);
   scannerTd.append(scannerView);
   return scannerTr;
}

function SetScannerEvents(currentScanner)
{
    // click on <td width="200px">Name</td> :
    // Collapse - expand
    // $('.scanner_div2').each((index,element) => {if(index===1){$(element).fadeToggle();} });

    //.collapsed legend::after {
    //    content: " [...]";
    //}


   // Input name
   $(currentScanner.inputName).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.Name = $(this).val();
      backgroundPage.saveStorage();
   });

   // Site
   $(currentScanner.inputSite).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.Site = $(this).val();
      backgroundPage.saveStorage();
   });

   // SearchSelector
   $(currentScanner.inputSearchSelector).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.SearchSelector = $(this).val();
      backgroundPage.saveStorage();
   });

   // CheckNow
   $(currentScanner.inputCheckNow).click(function () {
      backgroundPage.doRequest(this.scanner);
   });

   // PollingInterval
   $(currentScanner.inputPollingInterval).on("change keyup", function ()   // change paste keyup
   {
       this.scanner.PollingInterval = $(this).val();
       backgroundPage.saveStorage();
   });

   // Open
   $(currentScanner.inputOpen).click(function () {
       //backgroundPage....
       chrome.tabs.create({ url: this.scanner.Site });
       backgroundPage.console.log("Open...");
   });

   // Delete
   $(currentScanner.inputDelete).click(function () {
       //backgroundPage....
       backgroundPage.console.log("Delete...");
   });

   // Result 
   // no event...

   // ArraySelector
   $(currentScanner.inputArraySelector).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.ArraySelector = $(this).val();
      backgroundPage.saveStorage();
   });

   // Enabled
   $(currentScanner.inputEnabled).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.Enabled = $(this).prop("checked");
      backgroundPage.saveStorage();
      // display number of unvalidated (and enabled) scanner 
      backgroundPage.countUnValided();
      backgroundPage.console.log("popup inputEnabled changed");
   });

   // Validated
   $(currentScanner.inputValidated).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.Validated = $(this).prop("checked");
      backgroundPage.saveStorage();
      // display number of unvalidated (and enabled) scanner 
      backgroundPage.countUnValided();
      backgroundPage.console.log("popup inputValidated changed");
   });

   // Hash  
   // no event...

   // CheckTime
   // no event...
}

