var ttrace ;
var resultTable;                // jquery for scannerList_table element
var backgroundPage;

function init() 
{
    // ReSharper disable once UseOfImplicitGlobalInFunctionScope
    backgroundPage = chrome.extension.getBackgroundPage() ;
    ttrace = backgroundPage.ttrace;

   // don't use the popup console. Use the backgroundPage console
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

        addEventListener("unload", function (event)
        {
           backgroundPage.console.log(event.type);
        }, true);

        fillScannerTable();
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
function CloneScannerTemplate(currentScanner) {
   var scannerTemplate = $(".scanner_div");
   var scannerView = scannerTemplate.clone().removeClass("scanner_div").addClass("scanner_div2");

   // Input name
   var inputName = scannerView.find(".template_Name")[0];
   inputName.scanner = currentScanner;
   currentScanner.inputName = inputName;
   currentScanner.inputName.value = currentScanner.Name;

   // Site
   var inputSite = scannerView.find(".template_Site")[0];
   inputSite.scanner = currentScanner;
   currentScanner.inputSite = inputSite;
   currentScanner.inputSite.value = currentScanner.Site;

   // SearchSelector
   var inputSearchSelector = scannerView.find(".template_SearchSelector")[0];
   inputSearchSelector.scanner = currentScanner;
   currentScanner.inputSearchSelector = inputSearchSelector;
   currentScanner.inputSearchSelector.value = currentScanner.SearchSelector;

   // template_CheckNow
   var inputCheckNow = scannerView.find(".template_CheckNow")[0];
   inputCheckNow.scanner = currentScanner;
   currentScanner.inputCheckNow = inputCheckNow;

   // Result
   var inputResult = scannerView.find(".template_Result")[0];
   inputResult.scanner = currentScanner;
   currentScanner.inputResult = inputResult;
   currentScanner.inputResult.innerText = "";

   // ArraySelector
   var inputArraySelector = scannerView.find(".template_ArraySelector")[0];
   inputArraySelector.scanner = currentScanner;
   currentScanner.inputArraySelector = inputArraySelector;
   currentScanner.inputArraySelector.value = currentScanner.ArraySelector;

   // Enabled
   var inputEnabled = scannerView.find(".template_Enabled")[0];
   inputEnabled.scanner = currentScanner;
   currentScanner.inputEnabled = inputEnabled;
   $(currentScanner.inputEnabled).prop("checked", currentScanner.Enabled);

   // Validated
   var inputValidated = scannerView.find(".template_Validated")[0];
   inputValidated.scanner = currentScanner;
   currentScanner.inputValidated = inputValidated;
   $(currentScanner.inputValidated).prop("checked", currentScanner.Validated);

   // Hash  
   var inputChecksum = scannerView.find(".template_Checksum")[0];
   inputChecksum.scanner = inputChecksum;
   currentScanner.inputChecksum = inputChecksum;
   var hashToDisplay = currentScanner.Hash;
   if (currentScanner.newHash !== "undefined" && currentScanner.Hash !== currentScanner.newHash)
      hashToDisplay = "" + currentScanner.newHash;
   currentScanner.inputChecksum.innerText = hashToDisplay;

   // CheckTime
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

   // template_CheckNow
   $(currentScanner.inputCheckNow).click(function () {
      backgroundPage.doRequest(this.scanner);
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
      this.scanner.Enabled = $(this).prop('checked');
      backgroundPage.saveStorage();
      // display number of unvalidated (and enabled) scanner 
      backgroundPage.countUnValided();
      backgroundPage.console.log("popup inputEnabled changed");
   });

   // Validated
   $(currentScanner.inputValidated).on("change keyup", function ()   // change paste keyup
   {
      this.scanner.Validated = $(this).prop('checked');
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

init();


