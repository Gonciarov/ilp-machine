    let targetsUpdated = {};
    let module;
    let saved = false;
    let requested = [];
    
  

    function sendRequest(module, targetsUpdated) {
        if (module !== null && targetsUpdated !== {}) {
            let xml = new XMLHttpRequest();
            xml.open("POST", "/ilp/save", true);
            xml.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
            xml.send(`module=${module}&data=${JSON.stringify(targetsUpdated)}`);
            targetsUpdated = {}
        }
    }

    function submitCompleted() {
        if (module !== null) {
            let xml = new XMLHttpRequest();
            xml.open("POST", "/ilp/submit", true);
            xml.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
            xml.send(`module=${module}`);
            targetsUpdated = {};
            location.reload();
            }

    }

    function change() {
        // let targetsClicked = document.getElementById(`table${module}`).getElementsByClassName("true")
        // let targetsAll = document.getElementById(`table${module}`).lastChild.childElementCount - 1
        
        displayStatusNotSaved();
        hideStatusSaved();
        changeTargetClasName();
        checkAllTargetsCompleted();
        saved = false;
    }

    function save() {
        sendRequest(module, targetsUpdated);
        hideStatusNotSaved();
        displayStatusSaved();
        saved = true;
        // module = null;
        // targetsUpdated = {}
        }
        
    function cancel() {
        restoreState();
        hideCancelAndSaveButtons();
        hideAllModules();
        hideStatusNotSaved();
        hideStatusSaved();
        hideResheduleSuggestion();
        hideRescheduleForm()
        displaySelectAModulePointer();
        displayAddAModuleButton();
        displayCurrentModulesThumbnails();
        displayThumbnailViewButtons();
        checkIfSideBarFitsViewport();
        displayYourCompletedHeader();
        displayYourCurrentHeader();
        saved = false;
    }

    function showTargets() {
        restoreState();
        hideStatusNotSaved();
        hideOtherModulesThumbnails();
        hideStatusSaved();
        hideSelectAModulePointer();
        hideAddModuleMenu();
        hideAddAModuleButton();
        hideAllModules();
        hideThumbnailViewButtons();
        hideYourCompletedHeader();
        hideYourCurrentHeader();
        displayTargetsTable();
        displayCancelAndSaveButtons();
        displayRescheduleSuggestion();
        checkIfSideBarFitsViewport();
        checkAllTargetsCompletedInitial();
    }

    function showCompletedModuleTargets() {
        restoreState();
        hideStatusNotSaved();
        hideOtherModulesThumbnails();
        hideStatusSaved();
        hideSelectAModulePointer();
        hideAddAModuleButton();
        hideAllModules();
        hideThumbnailViewButtons();
        hideYourCurrentHeader();
        hideYourCompletedHeader();
        displayCompletedTargetsTable();
        displayBackLink();
        checkIfSideBarFitsViewport();
        
    }

    function addModule() {
        restoreState();
        hideCurrentModules();
        hideOtherModulesThumbnails();
        hideHelloName();
        hideAddAModuleButton();
        displayAddModuleMenu();
        displayModulesMenuCancel();
        hideStatusNotSaved();
        hideStatusSaved();
        hideAllModules();
        hideCancelAndSaveButtons();
        hideYourCompletedHeader();
        checkIfSideBarFitsViewport();
        
    }

    function displayModuleDescription() {
        restoreState();
        hideModulesDescriptions();
        hideSelectAModulePointer();
        displaySingleModuleDescription();
    }

    function hideModuleDescription() {
        restoreState();
        displaySelectAModulePointer();
        hideSingleModuleDescription();
        displayAddAModuleButton();
        displayCurrentModules();
        displayCurrentModulesThumbnails();
        displayYourCurrentHeader();
        displayYourCompletedHeader();
        displayHelloName();
        hideAddModuleMenu();
        hideModulesMenuCancel();
        checkIfSideBarFitsViewport();
    }

    function submitAddModuleRequest() {
        displayCurrentModules();
    }

    function hideHelloName() {
        document.getElementById("ilp-hello-name").style = "display: none;"
    }


    function displayHelloName() {
        document.getElementById("ilp-hello-name").style = "display: block;"
    }

    function hideYourCurrentHeader() {
        document.getElementById("header-your-current").style = "display: none;"
    }


    function displayYourCurrentHeader() {
        document.getElementById("header-your-current").style = "display: block;"
    }

    function hideYourCompletedHeader() {
        document.getElementById("header-your-completed").style = "display: none;"
    }


    function displayYourCompletedHeader() {
        document.getElementById("header-your-completed").style = "display: block;"
    }

    function hideSelectAModulePointer() {
        document.getElementById("ilp-select-module").style = "display: none;"
    }

    function displaySelectAModulePointer() {
        document.getElementById("ilp-select-module").style = "display: block;"
    }

    function hideAddAModuleButton() {
        document.getElementById("add-module-button").style = "display: none";
    }

    function displayAddAModuleButton() {
        document.getElementById("add-module-button").style = "display: inline-block";
    }

    function displayAddModuleMenu() {
        document.getElementById("add-module").style = "display: block";
    }

    function hideAddModuleMenu() {
        document.getElementById("add-module").style = "display: none";
    }

    function hideModulesDescriptions() {
        let modules = document.getElementsByClassName("descriptions")
        for (let i= 0; i< modules.length; i++ ) {
            modules[i].style = "display: none;"
        }
    }

    function displaySingleModuleDescription() {
        let id = window.event.currentTarget.value
        document.getElementById("description" + id).style = "display: block;"
    }

    function hideSingleModuleDescription() {
        // let id = window.event.currentTarget.parentElement.parentElement.id
        // document.getElementById(id).style = "display: none;"
        let descriptions = document.getElementsByClassName("descriptions")
        for (let i=0; i<descriptions.length; i++) {
           descriptions[i].style = "display: none;"
        }
    }

    function hideRequstedToRemoveStatus() {
        document.getElementsByClassName("req-remove")
    }

    function hideStatusNotSaved() {
        document.getElementById("ilp-not-saved").style = "display:none";
    }

    function displayStatusNotSaved() {
        document.getElementById("ilp-not-saved").style.display = "inline";
    }

    function hideStatusSaved() {
        document.getElementById("ilp-saved").style.display = "none";
    }

    function displayStatusSaved() {
        document.getElementById("ilp-saved").style.display = "inline";
    }

    function hideAllModules() {
        let allModules = document.getElementsByClassName("single-module");
        for (let i=0; i<allModules.length; i++) {
            allModules[i].style = "display: none;"
        }
    }

    function checkAllTargetsCompleted() {
        let table = window.event.target.parentElement.parentElement.parentElement
        let targets = table.getElementsByClassName("false")
        targets.length === 0 ? displaySubmitButton() : hideSubmitButton()
    }

    function checkAllTargetsCompletedInitial() {
        let moduleName = window.event.target.value;
        let table = document.getElementById(`table${moduleName}`);
        let targets = table.getElementsByClassName("false");
        targets.length === 0 ? displaySubmitButton() : hideSubmitButton()
    }

    function displaySubmitButton() {
        let allowed = checkIfModuleRequested();
        console.log(allowed)
        let requested = document.getElementsByClassName(`requested-${module}`)
       if (allowed && requested.length == 0) {
            document.getElementById("submit-completed").style.display = "inline-block"
       } 
    }

    function hideSubmitButton() {
        document.getElementById("submit-completed").style.display = "none"
    }

    function hideCancelAndSaveButtons() {
        document.getElementById("ilp-cancel-button").style.display = "none";
        document.getElementById("ilp-save-button").style.display = "none";
    }

    function displayCancelAndSaveButtons() {
        document.getElementById("ilp-cancel-button").style.display = "inline-block";
        document.getElementById("ilp-save-button").style.display = "inline-block";
    }

    function displayTargetsTable() {
        module = window.event.target.value;
        document.getElementById(`table${module}`).style.display="block"
    }

    function displayCompletedTargetsTable() {
        module = window.event.target.value;
        document.getElementById(`completed-thumbnail-${module}`).style.display="block";
        document.getElementById(`completed${module}`).style.display="block";
        
       
    }

    function changeTargetClasName() {
        if (window.event.target.className === "true") {
            window.event.target.className = "false";
            targetsUpdated[window.event.target.id] = "false";
            
        } else {
            window.event.target.className = "true";
            targetsUpdated[window.event.target.id] = "true";
            
            }
    }

    function hideCurrentModules() {
        document.getElementById("current-modules").style.display = "none";
    }

    function displayCurrentModules() {
        document.getElementById("current-modules").style.display = "block";
    }

    function hideOtherModulesThumbnails() {
        let id = window.event.currentTarget.parentElement.id
        let thumbnails = document.getElementsByClassName('sidebar-single-thumbnail')
        for (let i=0; i<thumbnails.length; i++) {
            if (thumbnails[i].id !== id) {
                thumbnails[i].style.display = "none"
            }
        }
    }

    function displayCurrentModulesThumbnails() {
        let thumbnails = document.getElementsByClassName('sidebar-single-thumbnail')
        for (let i=0; i<thumbnails.length; i++) {
                thumbnails[i].style.display = "block"
        }
    }

    function hideThumbnailViewButtons() {
        let viewButtons = document.getElementsByClassName("thumbnail-view-button")
        for (let i=0; i<viewButtons.length; i++) {
                viewButtons[i].style.display = "none"
        }
    }

    function displayThumbnailViewButtons() {
        let viewButtons = document.getElementsByClassName("thumbnail-view-button")
        for (let i=0; i<viewButtons.length; i++) {
                viewButtons[i].style.display = "inline-block"
        }
    }

    function displayModulesMenuCancel() {
        document.getElementById("modules-menu-cancel").style.display = "inline-block";
    }

    function hideModulesMenuCancel() {
        document.getElementById("modules-menu-cancel").style.display = "none";
    }

    function restoreState() {
        for ( i in targetsUpdated ) {
            
            let element = document.getElementById(i)
            if (targetsUpdated[i] === "true") {
                if (element.className) {
                    element.className = "false";
                }
                 else {element.parentElement.className = "false"}
                
            } else {
                if (element.className) {
                    element.className = "true";
                }
                 else { element.parentElement.className = "false"}
            }
        }
        module = null;
        targetsUpdated = {} 
    }

    window.onload = (event) => {
        checkIfSideBarFitsViewport();
        findOverdueModules();
        hideResheduleSuggestion();
    }
    
    function isInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        );

    }

    function checkIfSideBarFitsViewport() {
        let fixedOrNot = document.getElementById("fixed-or-not");
        if (isInViewport(fixedOrNot)) {
            fixedOrNot.className = "fixed-part"
        } else {
            fixedOrNot.className = "not-fixed-part"
        }
    }

/* ilp overdue status and reschedule */    

function findOverdueModules() {
    let today = new Date().toJSON().slice(0, 10);
    let dates = document.getElementsByClassName("date")
    for (let i=0; i<dates.length; i++) {
        let targetDate = dates[i].value;
        if(today > targetDate) {
            displayOverdueStatus(targetDate);
        }
    }
}



function displayOverdueStatus(targetDate) {
    document.getElementById(`overdue-${targetDate}`).style.display = "block";
}

function hideOverdueStatusAll() {
    let overdueNotes = document.getElementsByClassName("overdue-note")
    for (let i=0; i<overdueNotes.length; i++) {    
        overdueNotes[i].style.display = "none;"
        
}
}

function displayRescheduleSuggestion() {
    let reschedules = document.getElementsByClassName("ilp-edit")
    for (let i=0; i<reschedules.length; i++) {      
        reschedules[i].style.display = "block"
        
}
}



function hideResheduleSuggestion() {
    let reschedules = document.getElementsByClassName("ilp-edit")
    for (let i=0; i<reschedules.length; i++) {    
        reschedules[i].style.display = "none"
}
}

function displayRescheduleForm() {
    hideResheduleSuggestion();
    // hideCancelAndSaveButtons();
    // hideAllModules();
    let id = window.event.currentTarget.parentElement.id.replace('thumbnail','')
    document.getElementById(`reschedule-form-${id}`).style.display = "block"
}

function hideRescheduleForm() {
    let forms = document.getElementsByClassName("reschedule-form")
    for (let i=0; i<forms.length; i++) {    
        forms[i].style.display = "none"
}
}

function displayBackLink() {
    document.getElementById("back-link").style.display = "block"
}

function checkIfModuleRequested() {
    let a;
    let req = document.getElementsByClassName(`requested-${module}`)
    console.log(req.length)
    req.length > 0 ? a = false : a = true
    return a
}