console.log("Visualization created by Colin Saumure");

let eventStateValues = {
    0: "Unavailable",
    1: "Dark",
    2: "Stop-Then-Proceed",
    3: "Stop-And-Remain",
    4: "Pre-Movement",
    5: "Permissive-Movement-Allowed",
    6: "Protected-Movement-Allowed",
    7: "Permissive-Clearance",
    8: "Protected-Clearance",
    9: "Caution-Conflicting-Traffic"
}

/*
Some Notes:

Bus Lane Signal Phases will have an eventState of 0 or "dark"
3 is Red
5 is Green
Protected/Permissive Deals with Combination Turn/Straightaway Lights
Yellow appears to lack its own phase
 */

document.getElementById("loading-indicator").remove();

let jsonData;
let intersections = {};
let container = document.getElementById("grid-container");
let contents = document.getElementById("contents-container");

function addSignalGroup(intersectionId) {
    let group = document.createElement("div");
    group.className = `grid-group ${intersectionId}`;
    container.appendChild(group);

    let heading = document.createElement("div");
    heading.className = "grid-heading";
    heading.id = intersectionId;
    group.appendChild(heading);
    heading.innerHTML = `<h1>Intersection #${intersectionId}</h1>`;

    for (let sigGroup in intersections[intersectionId]["signalGroups"]) {
        let state;
        if (intersections[intersectionId]["signalGroups"][sigGroup].hasOwnProperty("state-time-speed")) {
            state = intersections[intersectionId]["signalGroups"][sigGroup]["state-time-speed"][0]["eventState"];
        } else if (intersections[intersectionId]["signalGroups"][sigGroup].hasOwnProperty("state_time_speed")) {
            state = intersections[intersectionId]["signalGroups"][sigGroup]["state_time_speed"][0]["eventState"];
        }
        state = parseState(state);
        let item = document.createElement("div");
        item.className = `grid-item ${sigGroup}`;
        group.appendChild(item);
        item.innerHTML = `<img class="state-img" src="/static/state_icon_${state}.png" alt="${state}"/><h4>Group ${parseInt(sigGroup) + 1}: ${englishState(state)}</h4>`
    }

    let nav = document.createElement("div");
    nav.className = "contents-item";
    nav.innerHTML = `<h4>Intersection #${intersectionId}</h4>`
    nav.onclick = () => {
        let e = document.getElementById(intersectionId);
        e.scrollIntoView();
    }
    contents.appendChild(nav);
}

function updateSignalGroup(intersectionId) {
    let group = document.getElementsByClassName(intersectionId)[0];
    let items = group.children;
    for (let sigGroup in intersections[intersectionId]["signalGroups"]) {
        let state;
        if (intersections[intersectionId]["signalGroups"][sigGroup].hasOwnProperty("state-time-speed")) {
            state = intersections[intersectionId]["signalGroups"][sigGroup]["state-time-speed"][0]["eventState"];
        } else if (intersections[intersectionId]["signalGroups"][sigGroup].hasOwnProperty("state_time_speed")) {
            state = intersections[intersectionId]["signalGroups"][sigGroup]["state_time_speed"][0]["eventState"];
        }
        state = parseState(state);
        for (let i in items) {
            let item = items[i];
            if (item.className && item.className.includes(sigGroup)) {
                item.innerHTML = `<img class="state-img" src="/static/state_icon_${state}.png" alt="${state}"/><h4>Group ${parseInt(sigGroup) + 1}: ${englishState(state)}</h4>`
            }
        }
    }
}

function gotoMap() {
    window.open("/blackjack/map")
}

function gotoPSM() {
    window.open("/blackjack/psm")
}

function englishState(state) {
    let e = {
        "Unavailable": "Unavailable",
        "Dark": "Dark",
        "Stop-Then-Proceed": "Stop Then Proceed",
        "Stop-And-Remain": "Stop and Remain",
        "Pre-Movement": "Pre-Movement",
        "Permissive-Movement-Allowed": "Permissive Movement Allowed",
        "Protected-Movement-Allowed": "Protected Movement Allowed",
        "Permissive-Clearance": "Permissive Clearance",
        "Protected-Clearance": "Protected Clearance",
        "Caution-Conflicting-Traffic": "Caution - Conflicting Traffic"
    }
    return e[state];
}

function parseState(state) {
    if (typeof state === "string") {
        for (let v in eventStateValues) {
            if (eventStateValues[v].toLowerCase() === state.toLowerCase()) return eventStateValues[v];
        }
        return "Internal Error - State '" + state + "' not recognized";
    } else if (typeof state === "number") {
        if (eventStateValues.hasOwnProperty(state)) {
            return eventStateValues[state];
        }
    }
}

function updateGrid() {
    for (let index = 0; index < Object.keys(jsonData).length; index++) {
        let intId = Object.keys(jsonData)[index];
        let intData = jsonData[intId];
        if (!intersections.hasOwnProperty(intId) && intData.hasOwnProperty("phases")) {
            // ADD NEW
            intersections[intId] = {
                "signalGroups": []
            }
            if (intData["phases"].hasOwnProperty("SPAT")) {
                for (let group in intData["phases"]["SPAT"]["intersections"][0]["states"]) {
                    intersections[intId]["signalGroups"].push(intData["phases"]["SPAT"]["intersections"][0]["states"][group]);
                }
            } else if (intData["phases"].hasOwnProperty("value")) {
                for (let group in intData["phases"]["value"]["SPAT"]["intersections"][0]["states"]) {
                    intersections[intId]["signalGroups"].push(intData["phases"]["value"]["SPAT"]["intersections"][0]["states"][group]);
                }
            }
            addSignalGroup(intId);
        } else if (intersections.hasOwnProperty(intId)) {
            if (intData["phases"].hasOwnProperty("SPAT")) {
                for (let group in intData["phases"]["SPAT"]["intersections"][0]["states"]) {
                    intersections[intId]["signalGroups"][group] = (intData["phases"]["SPAT"]["intersections"][0]["states"][group]);
                }
            } else if (intData["phases"].hasOwnProperty("value")) {
                for (let group in intData["phases"]["value"]["SPAT"]["intersections"][0]["states"]) {
                    intersections[intId]["signalGroups"][group] = (intData["phases"]["value"]["SPAT"]["intersections"][0]["states"][group]);
                }
            }
            updateSignalGroup(intId);
        }
    }
}

let xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        jsonData = JSON.parse(xhttp.responseText);
        updateGrid();
    }
}

xhttp.open("GET", "/blackjack/json", true);
xhttp.send();

setInterval(() => {
    xhttp.open("GET", "/blackjack/json", true);
    xhttp.send();
}, 1000)
