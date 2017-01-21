// This popup "View" is recreated each time the user click the extension button

var ttrace;
var backgroundPage;
var chrome;                     // remove warning about undeclared chrome var

// tracetool is not loaded. We can use backgroundPage.ttrace
// jquery is needed in this context to generate popup scanner list
requirejs(["../components/jquery.min"], function () {
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
        backgroundPage.currentPopup = this;
        $("#check_all_button").click(function ()
        {
            backgroundPage.CheckScanners(null, true);
        }); 
         
        $("#add_page_button").click(function () {
            AddCurrentPage();
        });

        $("#collapse_all_button").click(function () {
            CollapseAll();
        });

        $("#expand_all_button").click(function () {
            ExpandAll();
        });

        addEventListener("unload", function (event)
        {
           backgroundPage.console.log(event.type);
           backgroundPage.currentPopup = null;
        }, true);

        fillScannerTable();
    });
}

function CollapseAll()
{
    for (var i = 0; i < backgroundPage.scannerList.length; i++)
    {
        var scanner = backgroundPage.scannerList[i];
        scanner.Collapsed = true;

        var $labelName = $(scanner.labelName);
        $labelName.addClass("collapsed");   // change icon

        var $divCollapeBlock = $(scanner.divCollapeBlock);
        $divCollapeBlock.fadeOut(100);
    }
    backgroundPage.saveStorage();
}

function ExpandAll()
{
    for (var i = 0; i < backgroundPage.scannerList.length; i++)
    {
        var scanner = backgroundPage.scannerList[i];
        scanner.Collapsed = false;
        var $labelName = $(scanner.labelName);
        $labelName.removeClass("collapsed");  // change icon

        var $divCollapeBlock = $(scanner.divCollapeBlock);
        $divCollapeBlock.fadeIn(100);
    }
    backgroundPage.saveStorage();
}

function AddCurrentPage()
{
    // https://developer.chrome.com/extensions/tabs#method-query

    // note that if the debugger for the popup is opened, this is not the lastFocusedWindow
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs)
    {
        if (tabs.length === 0) 
            return ;
        var url = tabs[0].url;
        backgroundPage.console.log("current page : ", url);

        var resultTable = $(".scannerList_table");
        var scanner = {};

        scanner.Name = tabs[0].title;
        scanner.ArraySelector = -1;  // 0 = first, n , -1 = last, -2 = use result array count as hash
        scanner.Enabled = true;
        scanner.Validated = true;
        scanner.Site = tabs[0].url;
        scanner.SearchSelector = "";    // whole page
        scanner.Hash = -1;
        scanner.CheckTime = 60;  // 60 minutes
        scanner.id = "scannerTr" + backgroundPage.scannerNextId;
        backgroundPage.scannerNextId++;
        backgroundPage.scannerList.push(scanner);

        var scannerTr = CloneScannerTemplate(scanner);
        SetScannerEvents(scanner);
        resultTable.append(scannerTr);

        backgroundPage.saveStorage();

    });
}

function deleteScanner(scanner)
{
   // remove from View 
   $("#" + scanner.id).remove();

   // remove from View Model : 
   var index = backgroundPage.scannerList.indexOf(scanner);
   backgroundPage.scannerList.splice(index, 1);

   // save Model
   backgroundPage.saveStorage();
}

function fillScannerTable()
{
    var resultTable = $(".scannerList_table");
 
    for (var i = 0; i < backgroundPage.scannerList.length; i++)
    {
        var scanner = backgroundPage.scannerList[i];
        var scannerTr = CloneScannerTemplate(scanner);
        SetScannerEvents(scanner);
        resultTable.append(scannerTr);
    }
}

// called by fillScannerTable or when a new scanner is added
function CloneScannerTemplate(scanner)
{
   var scannerTemplate = $(".scanner_div");
   // ReSharper disable once UnknownCssClass
   var scannerView = scannerTemplate.clone().removeClass("scanner_div").addClass("scanner_div_ok");

   scanner.scannerView = scannerView;

   // Name : Edit
   var inputName = scannerView.find(".template_Name")[0];
   inputName.scanner = scanner;
   scanner.inputName = inputName;
   scanner.inputName.value = scanner.Name;

   // Name : Label
   var labelName = scannerView.find(".span-Name")[0];
   labelName.scanner = scanner;
   scanner.labelName = labelName;

   // collapse-block : div to collapse
   var divCollapeBlock = scannerView.find(".collapse-block")[0];
   divCollapeBlock.scanner = scanner;
   scanner.divCollapeBlock = divCollapeBlock;
   if (scanner.Collapsed === true)
       setTimeout(function () { $(divCollapeBlock).fadeOut(100); }, 100);  // must be done when template is attached to scannerList_table

   // Site : Edit
   var inputSite = scannerView.find(".template_Site")[0];
   inputSite.scanner = scanner;
   scanner.inputSite = inputSite;
   scanner.inputSite.value = scanner.Site;

   // SearchSelector : Edit
   var inputSearchSelector = scannerView.find(".template_SearchSelector")[0];
   inputSearchSelector.scanner = scanner;
   scanner.inputSearchSelector = inputSearchSelector;
   scanner.inputSearchSelector.value = scanner.SearchSelector;

   // CheckNow : Button
   var inputCheckNow = scannerView.find(".template_CheckNow")[0];
   inputCheckNow.scanner = scanner;
   scanner.inputCheckNow = inputCheckNow;

    // Open : Button
   var inputOpen = scannerView.find(".template_Open")[0];
   inputOpen.scanner = scanner;
   scanner.inputOpen = inputOpen;

    // Delete : Button
   var inputDelete = scannerView.find(".template_Delete")[0];
   inputDelete.scanner = scanner;
   scanner.inputDelete = inputDelete;

   // Result : Text
   var inputResult = scannerView.find(".template_Result")[0];
   inputResult.scanner = scanner;
   scanner.inputResult = inputResult;
   scanner.inputResult.innerText = "";

   // ArraySelector : Edit
   var inputArraySelector = scannerView.find(".template_ArraySelector")[0];
   inputArraySelector.scanner = scanner;
   scanner.inputArraySelector = inputArraySelector;
   scanner.inputArraySelector.value = scanner.ArraySelector;

    // PollingInterval : Edit
   var inputPollingInterval = scannerView.find(".template_PollingInterval")[0];
   inputPollingInterval.scanner = scanner;
   if (inputPollingInterval === undefined)
       inputPollingInterval = 1;
   scanner.inputPollingInterval = inputPollingInterval;
   scanner.inputPollingInterval.value = scanner.PollingInterval;

    // Enabled : Checkbox
   var inputEnabled = scannerView.find(".template_Enabled")[0];
   inputEnabled.scanner = scanner;
   scanner.inputEnabled = inputEnabled;
   $(scanner.inputEnabled).prop("checked", scanner.Enabled);

   // Validated : Checkbox
   var inputValidated = scannerView.find(".template_Validated")[0];
   inputValidated.scanner = scanner;
   scanner.inputValidated = inputValidated;
   $(scanner.inputValidated).prop("checked", scanner.Validated);

   // Hash : Text
   var inputChecksum = scannerView.find(".template_Checksum")[0];
   inputChecksum.scanner = inputChecksum;
   scanner.inputChecksum = inputChecksum;
   var hashToDisplay = scanner.Hash;
   if (scanner.newHash !== "undefined" && scanner.Hash !== scanner.newHash)
      hashToDisplay = "" + scanner.newHash;
   scanner.inputChecksum.innerText = hashToDisplay;

   // CheckTime : Text
   var inputCheckTime = scannerView.find(".template_CheckTime")[0];
   inputCheckTime.scanner = inputCheckTime;
   scanner.inputCheckTime = inputCheckTime;
   var checkTime = scanner.CheckTime;
   if (checkTime === null || checkTime === undefined)
      checkTime = "";
   scanner.inputCheckTime.innerText = checkTime;

   var scannerTr = $("<tr></tr>");
   var scannerTd = $("<td></td>");
   scannerTr.append(scannerTd);
   scannerTd.append(scannerView);

   // set row id
   $(scannerTr).attr({ id: scanner.id });

   scannerTr.scanner = scanner;
   return scannerTr;
}

function SetScannerEvents(currentScanner)
{
    // click on <td width="200px">Name</td> :
    // Collapse - expand
    // $('.scanner_div_ok').each((index,element) => {if(index===1){$(element).fadeToggle();} });

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

   // PollingInterval
   $(currentScanner.inputPollingInterval).on("change keyup", function ()   // change paste keyup
   {
       this.scanner.PollingInterval = $(this).val();
       backgroundPage.saveStorage();
   });

   // label name click 
   $(currentScanner.labelName).click(function ()
   {
      // <div>
      //     <span class="span-left span-Name">Name</span> ===>  CLICK : fadeToggle div with class "collapse-block"
      //     <span class="span-right"><textarea class="template_Name">CodeProject - Tracetool</textarea></span>
      // </div>
      // <div class="collapse-block"> ...


      // fadeToggle is a jquery method
      var $labelName = $(this);
      $labelName.toggleClass("collapsed");

      var domLabelName = $labelName[0];
      var $divCollapeBlock = $(domLabelName.scanner.divCollapeBlock);
      domLabelName.scanner.Collapsed = $divCollapeBlock.is(":visible");

      $divCollapeBlock.fadeToggle(100);
      backgroundPage.saveStorage();
   });

   // Open
   $(currentScanner.inputOpen).click(function ()
   {
       chrome.tabs.create({ url: this.scanner.Site });
   });

   // Delete
   $(currentScanner.inputDelete).click(function ()
   {
       deleteScanner(this.scanner);
   });

   // CheckNow
   $(currentScanner.inputCheckNow).click(function ()
   {
      backgroundPage.CheckScanners(this.scanner, true);
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

