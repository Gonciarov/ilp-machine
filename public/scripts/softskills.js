let softskillsUpdated = {};
let column;
let saved = false;
let counter = 0;
let totalSoftSkillsCount = 0;
let number = 0;


window.onload = (event) => {
    totalSoftSkillsCount = getTotalSoftSkillsCount();
    counter = getCounter();
    calculate();
    document.getElementById("big-num").innerText = number;
}

function stashBigNum() {
    if (!saved) {
        totalSoftSkillsCount = getTotalSoftSkillsCount();
        counter = getCounter();
        calculate();
        document.getElementById("big-num").innerText = number;
    }
}


function sendRequest(column, softskillsUpdated) {
    if (column !== null && softskillsUpdated !== {}) {
    let xml = new XMLHttpRequest();
    xml.open("POST", "/softskills", true);
    xml.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
    xml.send(`column=${column}&data=${JSON.stringify(softskillsUpdated)}`);
    softskillsUpdated = {}
    }
}

function change() {
    
    document.getElementById("not-saved").style.display = "inline";
    document.getElementById("saved").style.display = "none";
    saved = false;
    if (window.event.target.className === "true") {
        window.event.target.className = "false";
        softskillsUpdated[window.event.target.id] = "false";
        counter -= 1;
    } else {
        window.event.target.className = "true";
        softskillsUpdated[window.event.target.id] = "true";
        counter += 1;
        }
        calculate();
   }

function save() {
    sendRequest(column, softskillsUpdated);
    let buttons = document.getElementsByClassName("sidebar-buttons");
    document.getElementById("not-saved").style.display = "none";
    document.getElementById("saved").style.display = "inline";
    saved = true;
    column = null;
    softskillsUpdated = {}
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
    let buttons = document.getElementsByClassName("sidebar-buttons");
    for (var i = 0; i < buttons.length; i++ ) {
        buttons[i].style = "none"
    }
    document.getElementById("not-saved").style = "display:none";
    document.getElementById("saved").style = "display:none";
    saved = false;
}

function showStuff() {
    restoreState();
    column = window.event.target.name
    document.getElementById("not-saved").style = "display:none";
    document.getElementById("saved").style.display = "none";
    let tables = document.getElementsByClassName("tables");
    for (var i = 0; i < tables.length; i++) {
        tables[i].style.display = "none";
    } 
        document.getElementById(column).style.display = "inline";
        document.getElementById("cancelButton").style.display = "inline-block";
        document.getElementById("saveButton").style.display = "inline-block";
    let buttons = document.getElementsByClassName("sidebar-buttons");
}


function getTotalSoftSkillsCount() {
    return parseInt(document.getElementById("totalSoftSkillsCount").value)
}

function getCounter() {
   return parseInt(document.getElementById("counter").value)
}

function calculate() {
    number = Math.round((counter / totalSoftSkillsCount * 100)).toString() + "%";
    document.getElementById("big-num").innerText = number;
}

function restoreState() {
    stashBigNum();
    let arr = Object.entries(softskillsUpdated)
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
    softskillsUpdated = {}
    
}
