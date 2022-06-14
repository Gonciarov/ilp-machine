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
        document.getElementById("ilp-not-saved").style.display = "inline";
        document.getElementById("ilp-saved").style.display = "none";
        saved = false;
       if (window.event.target.className === "true") {
            window.event.target.className = "false";
            targetsUpdated[window.event.target.id] = "false";
            
        } else {
            window.event.target.className = "true";
            targetsUpdated[window.event.target.id] = "true";
            
            }
        
    }

    function save() {
        sendRequest(module, targetsUpdated);
        let buttons = document.getElementsByClassName("sidebar-buttons");
        for (var i = 0; i < buttons.length; i++ ) {
            buttons[i].style = "none"
        }
        document.getElementById("ilp-not-saved").style.display = "none";
        document.getElementById("ilp-saved").style.display = "inline";
        saved = true;
        module = null;
        targetsUpdated = {}
        }
        
    function cancel() {
        restoreState();
        document.getElementById("ilp-save-button").style.display = "none";
        document.getElementById("ilp-cancel-button").style.display = "none";
        let allModules = document.getElementsByClassName("single-module");
        for (let i=0; i<allModules.length; i++) {
            allModules[i].style = "display: none;"
        }
        let buttons = document.getElementsByClassName("sidebar-buttons");
        for (var i = 0; i < buttons.length; i++ ) {
            buttons[i].style = "none"
        }
        document.getElementById("ilp-not-saved").style = "display:none";
        document.getElementById("ilp-saved").style = "display:none";
        document.getElementById("ilp-select-module").style = "display:block";
        saved = false;
    }

    function showStuff() {
        restoreState();
        module = window.event.target.value;
        console.log(module)
        document.getElementById("ilp-not-saved").style = "display:none";
        document.getElementById("ilp-saved").style.display = "none";
        document.getElementById("ilp-select-module").style = "display:none";
        let allModules = document.getElementsByClassName("single-module");
        for (let i=0; i<allModules.length; i++) {
            allModules[i].style = "display: none;"
        }
        document.getElementById(`table${module}`).style.display="block"
        document.getElementById("ilp-cancel-button").style.display = "inline-block";
        document.getElementById("ilp-save-button").style.display = "inline-block";
        let buttons = document.getElementsByClassName("sidebar-buttons");
        for (var i = 0; i < buttons.length; i++ ) {
            if (buttons[i].name === module) {
            buttons[i].style = "background-color: #DD4A48";
        } else {
            buttons[i].style = "none"
        }
        }
    }

    function restoreState() {
        let arr = targetsUpdated
        console.log(arr)
        for ( i in arr ) {
            
            let element = document.getElementById(i)
            if (arr[i] === "true") {
                if (element.className) {
                    element.className = "false";
                }
                 else { element.parentElement.className = "false"}
                
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
