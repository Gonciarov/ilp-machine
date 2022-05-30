window.onload = (event) => {
    let dialogId = document.getElementById("dialogId").value
    let xml = new XMLHttpRequest();
    xml.open("POST", "/unseen-seen", true);
    xml.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
    xml.send(`dialogId=${dialogId}`);
}