// This popup "View" is recreated each time the user click the extension button

var ttrace;
var backgroundPage;
var chrome;                     // remove warning about undeclared chrome var

var $inputCheckAll        ;
var $inputAddPage         ;
var $inputCheckNow        ;
var $inputOpen            ;
var $inputDelete          ;
var $inputName            ;
var $inputSite            ;
var $inputSearchSelector  ;
var $inputResult          ;
var $inputArraySelector   ;
var $inputPollingInterval ;
var $inputCheckTime       ;
var $inputChecksum        ;
var $inputEnabled         ;
var $inputValidated       ;
         

var selectedScanner = null ;

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
        backgroundPage.currentPopup.RefreshView = RefreshView ;

        addEventListener("unload", function (event)
        {
           backgroundPage.console.log(event.type);
           backgroundPage.currentPopup = null;
        }, true);

        $inputCheckAll        = $("#check_all_button") ;
        $inputAddPage         = $("#add_page_button") ;
        $inputCheckNow        = $("#template_CheckNow");
        $inputOpen            = $("#template_Open") ;
        $inputDelete          = $("#template_Delete") ;
        $inputName            = $("#template_Name") ;
        $inputSite            = $("#template_Site") ;
        $inputSearchSelector  = $("#template_SearchSelector") ;
        $inputResult          = $("#template_Result") ;
        $inputArraySelector   = $("#template_ArraySelector") ;
        $inputPollingInterval = $("#template_PollingInterval") ;
        $inputCheckTime       = $("#template_CheckTime") ;
        $inputChecksum        = $("#template_Checksum") ;
        $inputEnabled         = $("#template_Enabled") ;
        $inputValidated       = $("#template_Validated") ;

        // check all button
        $inputCheckAll.click(function ()
        {
            backgroundPage.CheckScanners(null, true);
        }); 
        
        // add current page button
        $inputAddPage.click(function () {
            AddCurrentPage();
        });

        // check selected scanner button
        $inputCheckNow.click(function () 
        {
            if (selectedScanner === null)
                return ;
            backgroundPage.CheckScanners(selectedScanner, true);
        });

        // open selected page button
        $inputOpen.click(function () 
        {
            if (selectedScanner === null)
                return ;
            chrome.tabs.create({ url: selectedScanner.Site });
        });

        // delete selected scanner button
        $inputDelete.click(function () 
        {
            if (selectedScanner === null)
                return ;

            // remove from View 
            $("#" + selectedScanner.id).remove();
 
            // remove from View Model : 
            var index = backgroundPage.scannerList.indexOf(selectedScanner);
            backgroundPage.scannerList.splice(index, 1);
 
            // save Model
            backgroundPage.saveStorage();
        });

        // Input name
        $inputName.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
           selectedScanner.Name = $(this).val();
           backgroundPage.saveStorage();
        });
 
        // Site
        $inputSite.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
           selectedScanner.Site = $(this).val();
           backgroundPage.saveStorage();
        });
 
        // SearchSelector
        $inputSearchSelector.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
           selectedScanner.SearchSelector = $(this).val();
           backgroundPage.saveStorage();
        });
 
        // PollingInterval
        $inputPollingInterval.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
            selectedScanner.PollingInterval = $(this).val();
            backgroundPage.saveStorage();
        });
 
        // ArraySelector
        $inputArraySelector.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
           selectedScanner.ArraySelector = $(this).val();
           backgroundPage.saveStorage();
        });
 
        // Enabled
        $inputEnabled.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
           selectedScanner.Enabled = $(this).prop("checked");
           backgroundPage.saveStorage();
           // display number of unvalidated (and enabled) scanner 
           backgroundPage.countUnValided();
           backgroundPage.console.log("popup inputEnabled changed");
        });
 
        // Validated
        $inputValidated.on("change keyup", function ()   // change paste keyup
        {
           if (selectedScanner === null)
               return ;
           selectedScanner.Validated = $(this).prop("checked");
           backgroundPage.saveStorage();
           // display number of unvalidated (and enabled) scanner 
           backgroundPage.countUnValided();
           backgroundPage.console.log("popup inputValidated changed");
        });
 
        fillScannerTable();
    });
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

        // create model
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
        backgroundPage.saveStorage();

        // create view mapped to model
        AddScannerToListUl(scanner) ;
    });
}

function fillScannerTable()
{
    selectedScanner = null ;
    for (var i = 0; i < backgroundPage.scannerList.length; i++)
    {
        var scanner = backgroundPage.scannerList[i];
        if (i === 0)
            selectedScanner = scanner ;
        AddScannerToListUl(scanner) ;
    }
    if (selectedScanner !== null)
    {
      $(selectedScanner.anchor).addClass('selected');                         // set the selected class to the <a>
      RefreshView();
    }
}

function AddScannerToListUl(scanner)
{
   var $anchor = $("<a>" + scanner.Name + "</a>") ;     // create view <a>
   var anchor = $anchor[0];
   anchor.scanner = scanner ;                           // link model to view
   scanner.anchor = anchor ;
   var $li = $("<li></li>");                            // create view <li>
   $li.attr({ id: scanner.id });                        // set row id
   $li.append($anchor);                                 // attach the 2 views <li><a> together

   $("#scannerListUl").append($li) ;                    // append to parent view

   if (scanner.isError)
      $anchor.addClass('scanner_div_err');
   else
      $anchor.removeClass('scanner_div_err');

   $anchor.click(function ()                                // view click    
   {
      $("#scannerListUl li a").removeClass("selected");     // remove "selected" class to all <a>
      $(this).addClass('selected');                         // set the selected class to the <a>
      selectedScanner = scanner ;
      RefreshView();
   });
}

// bind scanner properties to the view
function RefreshView()
{
   $inputName           [0].value =     selectedScanner.Name;              // textarea
   $inputSite           [0].value =     selectedScanner.Site;              // textarea
   $inputSearchSelector [0].value =     selectedScanner.SearchSelector;    // textarea
   $inputResult         [0].innerText = selectedScanner.resultString;      // span
   $inputArraySelector  [0].value =     selectedScanner.ArraySelector;     // input
   $inputPollingInterval[0].value =     selectedScanner.PollingInterval;   // input
   $inputCheckTime      [0].innerText = selectedScanner.CheckTime;         // span
   $inputChecksum       [0].innerText = selectedScanner.newHash;           // span
   $inputEnabled        .prop("checked",selectedScanner.Enabled);          // input checkbox
   $inputValidated      .prop("checked",selectedScanner.Validated);        // input checkbox

   if (selectedScanner.isError)
       $(selectedScanner.anchor).addClass('scanner_div_err');  // $(scanner.scannerView).attr('class', 'scanner_div_err');
   else
       $(selectedScanner.anchor).removeClass('scanner_div_err');

   
}


