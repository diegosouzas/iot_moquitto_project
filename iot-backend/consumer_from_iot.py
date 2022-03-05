import paho.mqtt.client as paho
import json
import pymysql
import datetime

topic="topic-from-iot"

def insertData(temp, umi):
    cnx = None
    try:
        now = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')
        db = pymysql.connect(host="localhost",user="root",passwd="root",database="iot" )
        cursor = db.cursor()

        cursor.execute("insert into monitor_iot (data_hora, temperatura, umidade) values (%s,%s, %s)", [now, temp, umi])
        db.commit()
    except:
        print("db error...")
    finally:
        if cnx != None:
            cnx.close()

def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe(topic)

def on_message(client, userdata, msg):
    payload = msg.payload.decode().replace("'", "\"")
    if "{" in payload:
        dpayload = json.loads(payload)
    else:
        dpayload = payload

    print(msg.topic+" ")
    print(dpayload)
    insertData(dpayload["temp"],dpayload["hum"])

print("iniciando")
client = paho.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect("127.0.0.1", 1883, 60)
print(".")

client.loop_forever()
