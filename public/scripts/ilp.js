    let targetsUpdated = {};
    let module;
    let saved = false;
    


    function sendRequest(module, targetsUpdated) {
        let xml = new XMLHttpRequest();
        xml.open("POST", "/ilp", true);
        xml.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        xml.send(`module=${module}&data=${JSON.stringify(targetsUpdated)}`);
        targetsUpdated = {}
    }

    function change() {
        displayStatusNotSaved();
        hideStatusSaved();
        changeTargetClasName()
        saved = false;
    }

    function save() {
        sendRequest(module, targetsUpdated);
        hideStatusNotSaved();
        displayStatusSaved();
        saved = true;
        module = null;
        targetsUpdated = {}
        }
        
    function cancel() {
        restoreState();
        hideCancelAndSaveButtons();
        hideAllModules();
        hideStatusNotSaved();
        hideStatusSaved();
        displaySelectAModulePointer();
        displayAddAModuleButton();
        displayCurrentModulesThumbnails();
        displayThumbnailViewButtons();
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
        displayTargetsTable();
        displayCancelAndSaveButtons();
       
        
    }

    function addModule() {
        restoreState();
        hideCurrentModules();
        hideHelloName();
        hideAddAModuleButton();
        displayAddModuleMenu();
        hideStatusNotSaved();
        hideStatusSaved();
        hideAllModules();
        hideCancelAndSaveButtons();
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
        hideAddModuleMenu()
    }

    function hideHelloName() {
        document.getElementById("ilp-hello-name").style = "display: none;"
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
        console.log(id)
        document.getElementById("description" + id).style = "display: block;"
    }

    function hideSingleModuleDescription() {
        let id = window.event.currentTarget.parentElement.parentElement.id
        document.getElementById(id).style = "display: none;"
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