#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include <DHT.h>
#include <SoftwareSerial.h> 

SoftwareSerial esp;  

#define DHTTYPE DHT11
#define DHTPIN  0
DHT dht(DHTPIN, DHTTYPE); // 11 works fine for ESP8266

long lastMsg = 0;
const char* ssid     = "00000";
const char* password = "00000";

bool showAllLog=false;

IPAddress server(192, 168, 0, 15);

WiFiClient ethClient;
PubSubClient clientMqtt(server, 1883, callback, ethClient);

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  int n = length;
  char spayload[n -2];
  
  memcpy(spayload, payload, n);  
  
  if(strcmp(spayload, "off") == 0){
    Serial.println("digitalWrite(2, LOW)");
    digitalWrite(2, LOW);
  }else{
    Serial.println("digitalWrite(2, HIGH)");
    digitalWrite(2, HIGH);
    
  }
  for (int i=0;i<length;i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void printStatusInternet(){
  if (WiFi.status() == WL_CONNECTED) {
    delay(500);
    Serial.print("WiFi connected, IP address: ");
    Serial.println(WiFi.localIP());
  }else{
    Serial.println("WiFi disconnected");
  }
}

void publishMsg(String msg){
  if (clientMqtt.connected()) {
    Serial.print("msg publicada: ");
    Serial.print(msg);
    clientMqtt.publish("topic-from-iot", msg.c_str());
  }   
}

void connectMqtt() {
  if (!clientMqtt.connected()) {
    if (clientMqtt.connect("clientESP1")) {
      Serial.println("clientMqtt connected");
      Serial.println("clientMqtt.subscribe(topic-to-iot)");
      clientMqtt.subscribe("topic-to-iot");
      //clientMqtt.loop();
      delay(100);
    }else {
      Serial.print("falha ao tentar conectar no Mqtt");
      delay(1000);
    }
  }else{
    if(showAllLog){
      Serial.println("clientMqtt connected");
    }
  }  
}

void connectWifi() {
  
  Serial.println();
  Serial.print("Connecting to wifi: ");
  Serial.println(ssid);
  Serial.print("WiFi.mode(WIFI_STA)");
  WiFi.mode(WIFI_STA);
  Serial.print("WiFi.begin(ssid, password)");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  printStatusInternet();
}

void setup()
{
  pinMode(2, OUTPUT);
  digitalWrite(2, LOW);
  Serial.begin(57600);
   
  dht.begin();
  connectWifi();
  
  delay(1500);
}

void loop()
{  
  connectMqtt();
  clientMqtt.loop();

  long now = millis();
  if (now - lastMsg > 30000) {
    float newTemp = dht.readTemperature();
    float newHum = dht.readHumidity();
    
    String msg = "{'temp': '" + (String)newTemp + "','hum':'"+ (String)newHum + "'}";
    
    Serial.println (msg);
    lastMsg = now;
    publishMsg(msg);
  }
 
}
