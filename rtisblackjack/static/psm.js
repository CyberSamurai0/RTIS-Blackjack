console.log("Visualization created by Colin Saumure");

document.getElementById("loading-indicator").remove();

let jsonData;
let intersections = {};
let container = document.getElementById("grid-container");
let contents = document.getElementById("contents-container");

function refreshGrid(intersectionId) {
    if (document.getElementById(intersectionId) === null) {
        let group = document.createElement("div");
        group.className = `grid-group-psm ${intersectionId}`;
        container.appendChild(group);

        let heading = document.createElement("div");
        heading.className = "grid-heading-psm";
        heading.id = intersectionId;
        group.appendChild(heading);
        heading.innerHTML = `<h1>Intersection #${intersectionId}</h1>`;

        let nav = document.createElement("div");
        nav.className = "contents-item";
        nav.innerHTML = `<h4>Intersection #${intersectionId}</h4>`
        nav.onclick = () => {
            let e = document.getElementById(intersectionId);
            e.scrollIntoView();
        }
        contents.appendChild(nav);

        let infoColumnSecondsAgo = document.createElement("div");
        infoColumnSecondsAgo.className = "grid-item info";
        infoColumnSecondsAgo.innerHTML = "<p>Timestamp</p>"
        group.appendChild(infoColumnSecondsAgo);

        let infoColumnPosition = document.createElement("div");
        infoColumnPosition.className = "grid-item info";
        infoColumnPosition.innerHTML = "<p>Position</p>"
        group.appendChild(infoColumnPosition);

        let infoColumnSpeed = document.createElement("div");
        infoColumnSpeed.className = "grid-item info";
        infoColumnSpeed.innerHTML = "<p>Speed</p>"
        group.appendChild(infoColumnSpeed);

        let infoColumnCrossRequest = document.createElement("div");
        infoColumnCrossRequest.className = "grid-item info";
        infoColumnCrossRequest.innerHTML = "<p>Crossing Requested</p>"
        group.appendChild(infoColumnCrossRequest);

        let infoColumnCrossState = document.createElement("div");
        infoColumnCrossState.className = "grid-item info";
        infoColumnCrossState.innerHTML = "<p>Crossing Authorized</p>"
        group.appendChild(infoColumnCrossState);
    }

    let group = document.getElementsByClassName(intersectionId)[0];
    for (let msgNumber in intersections[intersectionId]) {
        let row = document.getElementsByClassName(`grid-item ${intersectionId}-${msgNumber}`);
        if (row !== null && row.length !== 0) {
            let ts = Object.keys(intersections[intersectionId][msgNumber])[0]
            // Message Row already created, update

            row[0].innerHTML = `<h4>${calculateTimestamp(ts)}</h4>`
            row[1].innerHTML = `<h4>${parseCoordinate(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["position"]["lat"], 7)}, ${parseCoordinate(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["position"]["long"], 7)}</h4>`
            row[2].innerHTML = `<h4>${intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["speed"]}<h4>`
            row[3].innerHTML = `<h4>${boolToEnglish(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["crossRequest"])}<h4>`
            row[4].innerHTML = `<h4>${boolToEnglish(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["crossState"])}<h4>`

        } else {
            let ts = Object.keys(intersections[intersectionId][msgNumber])[0]
            // Message Row doesn't exist

            let infoColumnSecondsAgo = document.createElement("div");
            infoColumnSecondsAgo.className = `grid-item ${intersectionId}-${msgNumber}`;
            infoColumnSecondsAgo.innerHTML = `<h4>${calculateTimestamp(ts)}</h4>`
            group.appendChild(infoColumnSecondsAgo);

            let infoColumnPosition = document.createElement("div");
            infoColumnPosition.className = `grid-item ${intersectionId}-${msgNumber}`;
            infoColumnPosition.innerHTML = `<h4>${parseCoordinate(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["position"]["lat"], 7)}, ${parseCoordinate(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["position"]["long"], 7)}</h4>`
            group.appendChild(infoColumnPosition);

            let infoColumnSpeed = document.createElement("div");
            infoColumnSpeed.className = `grid-item ${intersectionId}-${msgNumber}`;
            infoColumnSpeed.innerHTML = `<h4>${intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["speed"]}<h4>`
            group.appendChild(infoColumnSpeed);

            let infoColumnCrossRequest = document.createElement("div");
            infoColumnCrossRequest.className = `grid-item ${intersectionId}-${msgNumber}`;
            infoColumnCrossRequest.innerHTML = `<h4>${boolToEnglish(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["crossRequest"])}<h4>`
            group.appendChild(infoColumnCrossRequest);

            let infoColumnCrossState = document.createElement("div");
            infoColumnCrossState.className = `grid-item ${intersectionId}-${msgNumber}`;
            infoColumnCrossState.innerHTML = `<h4>${boolToEnglish(intersections[intersectionId][msgNumber][ts]["value"]["PersonalSafetyMessage"]["crossState"])}<h4>`
            group.appendChild(infoColumnCrossState);
        }
    }
}

function gotoMap() {
    window.open("/blackjack/map")
}

function gotoGrid() {
    window.open("/blackjack")
}

function boolToEnglish(b) {
    if (b) return "Yes";
    return "No";
}

function parseCoordinate(c, expectedDecimals) {
    if (typeof c == "number") {
        return c / (10 ** expectedDecimals);
    }
}

function calculateTimestamp(ts) {
    let time = Math.floor((Date.now() - ts + 1) / 1000); // Added a +1 buffer because the PSM messages are returning a timestamp newer than Date.now()
    let timeString;

    if (time > 86400) {
        time = Math.floor(time / 86400);
        if (time > 1) timeString = `${time} days ago`;
        else timeString = `${time} day ago`;
    } else if (time > 3600) {
        time = Math.floor(time / 3600);
        if (time > 1) timeString = `${time} hours ago`;
        else timeString = `${time} hour ago`;
    } else if (time > 60) {
        time = Math.floor(time / 60);
        if (time > 1) timeString = `${time} minutes ago`;
        else timeString = `${time} minute ago`;
    } else {
        if (time > 1) timeString = `${time} seconds ago`;
        else timeString = `${time} second ago`;
    }

    return timeString;
}

function updatePSMGrid() {
    for (let index = 0; index < Object.keys(jsonData).length; index++) {
        let intId = Object.keys(jsonData)[index];
        let intData = jsonData[intId];
        intersections[intId] = intData

        refreshGrid(intId);
    }
}

let xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        jsonData = JSON.parse(xhttp.responseText);
        updatePSMGrid();
    }
}

xhttp.open("GET", "/blackjack/json_psm", true);
xhttp.send();

setInterval(() => {
    xhttp.open("GET", "/blackjack/json_psm", true);
    xhttp.send();
}, 1000)
