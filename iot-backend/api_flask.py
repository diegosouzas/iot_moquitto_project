import json
from flask import Flask
import flask
from flask_cors import CORS
import paho.mqtt.client as paho
import pymysql


app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

broker="127.0.0.1"
port=1883
topic="topic-to-iot"

def on_publish(client,userdata,result):             
    print("data published in "+topic+" \n")
    pass

def publish(value):
    client1= paho.Client("p_to_iot")                           
    client1.on_publish = on_publish                          
    client1.connect(broker,port)                                 
    ret= client1.publish(topic,value) 
    client1.disconnect()

@app.route('/enviar_cmd_iot/<cmd>')
def send_cmd(cmd):
    print(cmd)
    publish(cmd)
    return cmd

@app.route('/get_dados_grafico')
def get_dados_grafico():
    res = get_dados_sensores_db()
    return flask.jsonify(res)

def get_dados_sensores_db():
    cnx = None
    try:
        db = pymysql.connect(host="localhost",user="root",passwd="root",database="iot" )
        cursor = db.cursor()

        cursor.execute("select * from (select temperatura, umidade, DATE_FORMAT(data_hora,'%H:%i:%s') hora from iot.monitor_iot order by data_hora desc limit 10) as t order by hora")

        rows = cursor.fetchall()

        keys = [ i[0] for i in cursor.description]

        res = {}

        for k in range(0, len(keys)):
            res.update({keys[k] :[ r[k] for r in rows]})

        return res
    except:
        print("db error...")
    finally:
        if cnx != None:
            cnx.close()



app.run("0.0.0.0")