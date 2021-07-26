from flask import Flask, redirect, render_template, jsonify
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
traffic_signals = dict()


def on_message(c, userdata, msg):
    # print(msg.topic + " " + str(msg.payload))
    path = msg.topic
    path = path.split("/")
    datatype = path[6]
    if datatype == 'MAP':
        content = json.loads(str(msg.payload.decode("utf-8")))
        if "intersectionId" in content: # Just in case something goes wrong on their end
            if str(content["intersectionId"]) in traffic_signals:
                traffic_signals[str(content["intersectionId"])]["MAP"] = content["map"]["value"]["MapData"]
            else:
                traffic_signals[str(content["intersectionId"])] = {
                    "MAP": content["map"]["value"]["MapData"]
                }
    elif datatype == 'SPAT':
        content = json.loads(str(msg.payload.decode("utf-8")))
        if "intersectionId" in content: # Just in case something goes wrong on their end
            if str(content["intersectionId"]) in traffic_signals:
                # Update Existing Data
                traffic_signals[str(content["intersectionId"])]["phases"] = content["spat"]
            else:
                # Add Data for New Traffic Signal
                traffic_signals[str(content["intersectionId"])] = {
                    "phases": content["spat"],
                }
    elif datatype == 'BSM':
        content = json.loads(str(msg.payload.decode("utf-8")))
        if "intersectionId" in content and "bsm" in content and "value" in content["bsm"]:
            if str(content["intersectionId"]) in traffic_signals:
                # Update Existing BSM Message
                traffic_signals[str(content["intersectionId"])]["BSM"] = content["bsm"]["value"]["BasicSafetyMessage"]
            else:
                # Add Data for New BSM Message
                traffic_signals[str(content["intersectionId"])] = {
                    "BSM": content["bsm"]["value"]["BasicSafetyMessage"],
                }


client.on_message = on_message

app = Flask(__name__)


@app.route("/")
def grid():
    return render_template("index2.html")


@app.route("/blackjack/json")
def json_delivery():
    return jsonify(traffic_signals)


@app.route("/blackjack/")
def run():
    return render_template("index.html")


if __name__ == '__main__':
    rc = client.connect("10.30.4.149")
    print("Connected with result code: " + str(rc))

    client.subscribe("#")
    client.loop_start()

    app.run()

