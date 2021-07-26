console.log("Visualization created by Colin Saumure")

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

let showInts = true;
let showBSM = true;

let m = L.map('map-container').setView([36.164992, -115.1562615], 15);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 22,
    id: 'mapbox/satellite-v9',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiY29saW5zYXVtdXJlIiwiYSI6ImNrcXU3bGN4cjAxc3cyb3BtZDJ2dnNiZ2EifQ.FbCLwP4jhy_NA3dr2uAOcg'
}).addTo(m);

let intsToggle = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('input');
        container.type = "button";
        container.title = "Toggle Intersections";
        container.style.backgroundColor = 'white'
        container.style.backgroundImage = "url(/static/TRAFFIC_TOGGLE_ICON.png)"
        container.style.backgroundRepeat = "no-repeat"
        container.style.backgroundSize = "30px 30px";
        //container.style.backgroundAttachment = "fixed";
        container.style.backgroundPosition = "center";
        container.style.width = "30px";
        container.style.height = "30px";
        container.style.cursor = "pointer";
        container.style.color = "black";
        container.style.border = 'none';
        container.style.borderRadius = "2px";
        container.style.boxShadow = "0 0 2px 2px #ccc";

        container.onclick = function() {
            showInts = !showInts;
            if (!showInts) {
                container.style.backgroundColor = '#DDD'
            } else {
                container.style.backgroundColor = 'white'
            }
        }

        return container;
    }
})

let BSMToggle = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('input');
        container.type = "button";
        container.title = "Toggle Vehicle Paths";
        container.style.backgroundColor = 'white'
        container.style.backgroundImage = "url(/static/CAR_ICON.png)"
        container.style.backgroundRepeat = "no-repeat"
        container.style.backgroundSize = "30px 30px";
        container.style.objectFit = "contain"
        container.style.width = "30px";
        container.style.height = "30px";
        container.style.color = "black"
        container.style.border = 'none';
        container.style.borderRadius = "2px"
        container.style.boxShadow = "0 0 2px 2px #ccc"

        container.onclick = function() {
            showBSM = !showBSM;
            if (!showBSM) {
                container.style.backgroundColor = '#DDD'
            } else {
                container.style.backgroundColor = 'white'
            }
        }

        return container;
    }
})

m.addControl(new intsToggle());
m.addControl(new BSMToggle());

document.getElementById("loading-indicator").remove();

const trafficIcon = L.icon({
    iconUrl: "/static/TRAFFIC_ICON.png",
    iconSize: [16, 40],
    iconAnchor: [8, 20],
});

let jsonData;
let intersections = {}
let layers = []
function updateMap() {
    let newlayers = []
    for (let index = 0; index < Object.keys(jsonData).length; index++) {
        let intId = Object.keys(jsonData)[index];
        let intData = jsonData[intId];
        if (intData.hasOwnProperty("MAP") && showInts) {
            /*
                Intersection Reference Point
             */
            let refPoint = [
                parseCoordinate(intData["MAP"]["intersections"][0]["refPoint"]["lat"], 7),
                parseCoordinate(intData["MAP"]["intersections"][0]["refPoint"]["long"], 7)
            ]
            let marker = new L.marker(refPoint, {icon: trafficIcon, title: intId});
            newlayers.push(marker)
            m.addLayer(marker);
            /*
                Intersection Lanes
             */

            intersections[intId] = {
                "signalGroups": {
                    1: [],
                    2: [],
                    3: [],
                    4: [],
                    5: [],
                    6: [],
                    7: [],
                    8: [],
                    9: [],
                    10: [],
                    11: [],
                    12: [],
                    13: [],
                    14: [],
                    15: [],
                    16: [],
                }
            }
            for (let i = 0; i < intData["MAP"]["intersections"][0]["laneSet"].length; i++) {
                let lane = intData["MAP"]["intersections"][0]["laneSet"][i];
                if (lane.hasOwnProperty("connectsTo")) {
                    let laneCoords = []
                    let laneColor = 'red';
                    if (lane["nodeList"]["nodes"][0]["delta"].hasOwnProperty("node-LatLon")) {
                        for (let x = 0; x < lane["nodeList"]["nodes"].length; x++) {
                            laneCoords.push([parseCoordinate(lane["nodeList"]["nodes"][x]["delta"]["node-LatLon"]["lat"], 7), parseCoordinate(lane["nodeList"]["nodes"][x]["delta"]["node-LatLon"]["lon"], 7)]);
                        }


                        if (lane["connectsTo"][0].hasOwnProperty("signalGroup")) {
                            if (intData["phases"].hasOwnProperty("SPAT")) {
                                for (let s = 0; s < intData["phases"]["SPAT"]["intersections"][0]["states"].length; s++) {
                                    if (intData["phases"]["SPAT"]["intersections"][0]["states"][s]["signalGroup"] === lane["connectsTo"][0]["signalGroup"]) {
                                        let state = intData["phases"]["SPAT"]["intersections"][0]["states"][s]["state-time-speed"][0]["eventState"]
                                        laneColor = getColor(state)
                                    }
                                }
                            } else if (intData["phases"].hasOwnProperty("value") && intData["phases"]["value"].hasOwnProperty("SPAT")) {
                                for (let s = 0; s < intData["phases"]["value"]["SPAT"]["intersections"][0]["states"].length; s++) {
                                    if (intData["phases"]["value"]["SPAT"]["intersections"][0]["states"][s]["signalGroup"] === lane["connectsTo"][0]["signalGroup"]) {
                                        let state = intData["phases"]["value"]["SPAT"]["intersections"][0]["states"][s]["state-time-speed"][0]["eventState"]
                                        laneColor = getColor(state)
                                    }
                                }
                            }
                        }
                        let laneline = L.polyline(laneCoords, {color: laneColor, interactive: false})
                        newlayers.push(laneline);
                        m.addLayer(laneline);
                    } else {
                        console.log(`Intersection ${intId} is configured to use XY5 coordinates! https://intercor-project.eu/wp-content/uploads/sites/15/2019/01/170629-MAP-profile-v1.2-subWG-NL-profiel.pdf`)
                    }
                }
            }
        }
        if (intData.hasOwnProperty("BSM") && showBSM) {
            let origin = {};
            if (intData["BSM"].hasOwnProperty("coreData")) {
                origin["lat"] = intData["BSM"]["coreData"]["lat"]
                origin["long"] = intData["BSM"]["coreData"]["long"]
            }
            if (origin !== {} && intData["BSM"].hasOwnProperty("partII") && intData["BSM"]["partII"][0]["partII-Value"]["VehicleSafetyExtensions"].hasOwnProperty("pathHistory")) {
                let pathCoords = [
                    [
                        parseCoordinate(origin["lat"], 7),
                        parseCoordinate(origin["long"], 7)
                    ]
                ]
                let pathColor = 'cyan';
                for (let c in intData["BSM"]["partII"][0]["partII-Value"]["VehicleSafetyExtensions"]["pathHistory"]["crumbData"]) {
                    let crumb = intData["BSM"]["partII"][0]["partII-Value"]["VehicleSafetyExtensions"]["pathHistory"]["crumbData"][c];
                    pathCoords.push([parseCoordinate(origin["lat"] - crumb["latOffset"], 7), parseCoordinate(origin["long"] - crumb["lonOffset"], 7)]);
                }
                let pathLine = L.polyline(pathCoords, {color: pathColor})
                newlayers.push(pathLine);
                m.addLayer(pathLine);
            }
        }
    }
    for (let old in layers) {
        m.removeLayer(layers[old]);
    }
    layers = newlayers;
}

function getColor(state) {
    let laneColor = 'red';
    if (state === 1 || (typeof state === "string" && state.toLowerCase() === "dark")) laneColor = "#000";
    else if (state === 3 || (typeof state === "string" && state.toLowerCase() === "stop-and-remain")) laneColor = "#F00";
    else if (state === 5 || (typeof state === "string" && state.toLowerCase() === "permissive-movement-allowed")) laneColor = "#0F0";
    else if (state === 7 || (typeof state === "string" && state.toLowerCase() === "permissive-clearance")) laneColor = "#FF0";
    return laneColor;
}

function parseCoordinate(c, expectedDecimals) {
    if (typeof c == "number") {
        return c / (10 ** expectedDecimals);
    }
}

let xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        jsonData = JSON.parse(xhttp.responseText);
        updateMap();
    }
}

xhttp.open("GET", "/blackjack/json", true);
xhttp.send();

setInterval(() => {
    xhttp.open("GET", "/blackjack/json", true);
    xhttp.send();
}, 1000)

