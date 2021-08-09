import paho.mqtt.client as mqtt
import json, time

client = mqtt.Client()
traffic_signals = dict()
psm_msgs = dict()


def on_message(c, userdata, msg):
    path = msg.topic
    path = path.split("/")
    datatype = path[6]
    if datatype == 'MAP':
        content = json.loads(str(msg.payload.decode("utf-8")))
        if "intersectionId" in content:  # Just in case something goes wrong on their end
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
    elif datatype == 'PSM':
        content = json.loads(str(msg.payload.decode("utf-8")))
        if "intersectionId" in content and "psm" in content and "ts" in content and "value" in content["psm"]:
            if str(content["intersectionId"]) in psm_msgs:
                if not str(content["ts"]) in psm_msgs[str(content["intersectionId"])]:
                    # Unique Message
                    psm_msgs[str(content["intersectionId"])].insert(0, {str(content["ts"]): content["psm"]})
            else:
                # Add Data for New PSM Message
                psm_msgs[str(content["intersectionId"])] = [
                    {str(content["ts"]): content["psm"]}
                ]
            # Limit 50 messages
            psm_msgs[str(content["intersectionId"])] = psm_msgs[str(content["intersectionId"])][:50]


client.on_message = on_message


if __name__ == '__main__':
    rc = client.connect("10.30.4.149")
    print("Connected with result code: " + str(rc))

    client.subscribe("#")
    client.loop_start()

    while True:
        with open('/var/www/html/blackjack/json_psm/psm.json', 'w') as outfile:
            outfile.write(json.dumps(psm_msgs))
            outfile.close()
        with open('/var/www/html/blackjack/json/traffic.json', 'w') as outfile:
                outfile.write(json.dumps(traffic_signals))
                outfile.close()
        time.sleep(0.5)
