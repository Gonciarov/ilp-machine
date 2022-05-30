let targetsUpdated = {};
    let column;
    let saved = false;
    let counter = 0;
    let totalTargetsCount = 0;
    let number = 0;
    

    window.onload = (event) => {
        totalTargetsCount = getTotalTargetsCount();
        counter = getCounter();
        calculate();
        document.getElementById("bigNum").innerText = number;
    }

    function stashBigNum() {
        if (!saved) {
            totalTargetsCount = getTotalTargetsCount();
            counter = getCounter();
            calculate();
            document.getElementById("bigNum").innerText = number;
        }
    }


    function sendRequest(column, targetsUpdated) {
        let xml = new XMLHttpRequest();
        xml.open("POST", "/targets", true);
        xml.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        xml.send(`column=${column}&data=${JSON.stringify(targetsUpdated)}`);
        targetsUpdated = {}
    }

    function change() {
        document.getElementById("notSaved").style.display = "inline";
        document.getElementById("saved").style.display = "none";
        saved = false;
        
       if (window.event.target.className === "true") {
            window.event.target.className = "false";
            targetsUpdated[window.event.target.id] = "false";
            counter -= 1;
        } else {
            window.event.target.className = "true";
            targetsUpdated[window.event.target.id] = "true";
            counter += 1;
            }
           
        calculate();
        
    }

    function save() {
        sendRequest(column, targetsUpdated);
        let buttons = document.getElementsByClassName("showButtons");
        for (var i = 0; i < buttons.length; i++ ) {
            buttons[i].style = "none"
        }
        document.getElementById("notSaved").style.display = "none";
        document.getElementById("saved").style.display = "inline";
        saved = true;
        column = null;
        targetsUpdated = {}
        calculate();
        }
        
    function cancel() {
        restoreState();
        document.getElementById("saveButton").style.display = "none";
        document.getElementById("cancelButton").style.display = "none";
        let tables = document.getElementsByClassName("tables");
        for (var i = 0; i < tables.length; i++) {
            tables[i].style.display = "none";
        }
        let buttons = document.getElementsByClassName("showButtons");
        for (var i = 0; i < buttons.length; i++ ) {
            buttons[i].style = "none"
        }
        document.getElementById("notSaved").style = "display:none";
        document.getElementById("saved").style = "display:none";
        saved = false;
    }

    function showStuff() {
        restoreState();
        column = window.event.target.name
        document.getElementById("notSaved").style = "display:none";
        document.getElementById("saved").style.display = "none";
        let tables = document.getElementsByClassName("tables");
        for (var i = 0; i < tables.length; i++) {
            tables[i].style.display = "none";
        } 
            document.getElementById(column).style.display = "inline";
            document.getElementById("cancelButton").style.display = "inline-block";
            document.getElementById("saveButton").style.display = "inline-block";
        let buttons = document.getElementsByClassName("showButtons");
        for (var i = 0; i < buttons.length; i++ ) {
            if (buttons[i].name === column) {
            buttons[i].style = "background-color: #DD4A48";
        } else {
            buttons[i].style = "none"
        }
        }
    }
    

    function getTotalTargetsCount() {
        return parseInt(document.getElementById("totalTargetsCount").value)
    }

    function getCounter() {
       return parseInt(document.getElementById("counter").value)
    }

    function calculate() {
        number = Math.round((counter / totalTargetsCount * 100)).toString() + "%";
        document.getElementById("bigNum").innerText = number;
    }

    function restoreState() {
        stashBigNum();
        let arr = Object.entries(targetsUpdated)
        for ( let i = 0; i < arr.length; i++ ) {
            let element = document.getElementById(arr[i][0])
            if (arr[i][1] === "true") {
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
        column = null;
        targetsUpdated = {}
        
    }