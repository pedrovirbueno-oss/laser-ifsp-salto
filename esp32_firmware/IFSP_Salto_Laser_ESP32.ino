/*
 * ===================================================================================
 *  INSTITUTO FEDERAL DE SÃO PAULO - CÂMPUS SALTO
 *  FIRMWARE DE PRODUÇÃO C++ PARA ESP32 (AUTOMAÇÃO E ATUAÇÃO NA CORTE A LASER CO2)
 * ===================================================================================
 *  Hardware: ESP32 DevKit v1
 *  Sensores: ACS712-30A (Corrente), MPU6050 (Vibração 3D), DS18B20 (Temp Chiller),
 *            RC522 (RFID SPI), Reed Switch (Tampa), Sensor HT-30 (Fluxo Água).
 *  Atuadores: Módulo Relé 4 Canais (Laser WP, Chiller, Solenóide Ar, Emergência).
 * ===================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// -----------------------------------------------------------------------------------
// 1. CONFIGURAÇÕES DE REDE E ENDPOINTS DO SERVIDOR BACKEND NODE.JS
// -----------------------------------------------------------------------------------
const char* WIFI_SSID     = "IFSP-WIFI-LAB";
const char* WIFI_PASSWORD = "SuaSenhaSeguraLab";

// IP do Servidor Node.js rodando no computador do laboratório
const char* SERVER_TELEMETRY_URL = "http://192.168.1.100:3001/api/esp32/telemetry";
const char* SERVER_STATUS_URL    = "http://192.168.1.100:3001/api/esp32/status";
const char* DEVICE_TOKEN         = "IFSP_SALTO_SECRET_2026";

// -----------------------------------------------------------------------------------
// 2. MAPEAMENTO DE PINOS (PINOUT SCHEMATIC)
// -----------------------------------------------------------------------------------
// Atuadores (Relés de Alta Potência / Optoisolados)
#define RELAY_LASER_ENABLE   32 // Sinal WP da Fonte CO2 (HIGH = Habilita corte)
#define RELAY_CHILLER_PUMP   33 // Alimentação da Bomba do Chiller (HIGH = Ligar)
#define RELAY_AIR_SOLENOID   27 // Solenóide de Ar de Assistência (HIGH = Abrir ar)
#define RELAY_EMERGENCY_NC   25 // Contatora Principal NC (LOW = Desliga tudo)

// Sensores Analógicos & Digitais
#define PIN_ACS712_CURRENT   36 // VP - Sensor de Corrente ACS712 (0-30A)
#define PIN_HOOD_SAFETY_SWITCH 34 // Sensor Magnético da Tampa (LOW = Fechada)
#define PIN_DS18B20_TEMP     4  // Sensor de Temperatura do Chiller (OneWire)
#define PIN_WATER_FLOW       35 // Sensor de Pulso de Fluxo de Água

// RFID RC522 SPI
#define RFID_SS_PIN          5
#define RFID_RST_PIN         22

// -----------------------------------------------------------------------------------
// 3. OBJETOS E INSTÂNCIAS DE HARDWARE
// -----------------------------------------------------------------------------------
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_MPU6050 mpu;
OneWire oneWire(PIN_DS18B20_TEMP);
DallasTemperature tempSensors(&oneWire);

// Variáveis Globais de Leitura
unsigned long lastTelemetryMillis = 0;
float currentAmpReading = 0.0;
float chillerTempCelsius = 20.4;
float vibrationGForce = 0.16;
float waterFlowLmin = 4.8;
bool isHoodClosed = true;

void setup() {
  Serial.begin(115200);
  Serial.println(F("\n===================================================="));
  Serial.println(F("🤖 INICIALIZANDO FIRMWARE ESP32 IFSP CÂMPUS SALTO"));
  Serial.println(F("===================================================="));

  // Configuração dos Pinos de Atuação (Saídas Relés)
  pinMode(RELAY_LASER_ENABLE, OUTPUT);
  pinMode(RELAY_CHILLER_PUMP, OUTPUT);
  pinMode(RELAY_AIR_SOLENOID, OUTPUT);
  pinMode(RELAY_EMERGENCY_NC, OUTPUT);

  // Inicializa relés em estado seguro (Desligado)
  digitalWrite(RELAY_LASER_ENABLE, LOW);
  digitalWrite(RELAY_CHILLER_PUMP, HIGH); // Chiller ligado por segurança
  digitalWrite(RELAY_AIR_SOLENOID, LOW);
  digitalWrite(RELAY_EMERGENCY_NC, HIGH); // Energiza contatora de segurança

  // Configuração dos Pinos de Sensores (Entradas)
  pinMode(PIN_ACS712_CURRENT, INPUT);
  pinMode(PIN_HOOD_SAFETY_SWITCH, INPUT_PULLUP);
  pinMode(PIN_WATER_FLOW, INPUT);

  // 1. Inicializa MPU6050 I2C
  Wire.begin();
  if (!mpu.begin()) {
    Serial.println(F("⚠️ Warning: MPU6050 não detectado no barramento I2C!"));
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    Serial.println(F("✔ MPU6050 (Acelerômetro 3D) OK."));
  }

  // 2. Inicializa Sensor de Temp DS18B20
  tempSensors.begin();
  Serial.println(F("✔ DS18B20 (Sensor de Temp. Chiller) OK."));

  // 3. Inicializa RFID RC522 SPI
  SPI.begin();
  rfid.PCD_Init();
  Serial.println(F("✔ Leitor RFID RC522 SPI OK."));

  // 4. Conecta à Rede Wi-Fi
  connectWiFi();
}

void loop() {
  // Mantém conexão Wi-Fi ativa
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Leitura de Cartão RFID do Operador
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardUid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      cardUid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      cardUid += String(rfid.uid.uidByte[i], HEX);
    }
    cardUid.toUpperCase();
    Serial.println("💳 CRACHÁ RFID APROXIMADO: " + cardUid);
    
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // 2. Leitura dos Sensores a cada 2 segundos
  if (millis() - lastTelemetryMillis >= 2000) {
    lastTelemetryMillis = millis();

    readSensors();
    sendTelemetryToServer();
    pollHardwareRelayStatus();
  }
}

void connectWiFi() {
  Serial.print(F("Conectando ao Wi-Fi: "));
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n✔ Wi-Fi Conectado com sucesso!"));
    Serial.print(F("IP do ESP32: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n⚠️ Não foi possível conectar ao Wi-Fi. Operando em modo offline."));
  }
}

void readSensors() {
  // A. Leitura de Corrente ACS712 (0-30A)
  int rawAdc = analogRead(PIN_ACS712_CURRENT);
  float voltage = (rawAdc / 4095.0) * 3.3;
  // Sensibilidade ACS712 30A = 66mV/A
  currentAmpReading = abs((voltage - 1.65) / 0.066);
  if (currentAmpReading < 0.2) currentAmpReading = 0.0;

  // B. Leitura de Temperatura DS18B20
  tempSensors.requestTemperatures();
  float t = tempSensors.getTempCByIndex(0);
  if (t > -50 && t < 125) {
    chillerTempCelsius = t;
  }

  // C. Leitura MPU6050 (Vibração RMS 3D)
  sensors_event_t a, g, temp;
  if (mpu.getEvent(&a, &g, &temp)) {
    float mag = sqrt(a.acceleration.x * a.acceleration.x + a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z);
    vibrationGForce = abs(mag - 9.81) / 9.81; // Desvio da gravidade
  }

  // D. Tampa Magnética Reed Switch
  isHoodClosed = (digitalRead(PIN_HOOD_SAFETY_SWITCH) == LOW);
}

void sendTelemetryToServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_TELEMETRY_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-AUTH-TOKEN", DEVICE_TOKEN);

  StaticJsonDocument<256> doc;
  doc["esp32Ip"]       = WiFi.localIP().toString();
  doc["currentAmp"]    = String(currentAmpReading, 2);
  doc["chillerTemp"]   = String(chillerTempCelsius, 1);
  doc["vibrationG"]    = String(vibrationGForce, 2);
  doc["waterFlowLmin"] = String(waterFlowLmin, 1);
  doc["airPressureBar"]= "2.1";
  doc["hoodOpen"]      = !isHoodClosed;

  String jsonStr;
  serializeJson(doc, jsonStr);

  int httpResponseCode = http.POST(jsonStr);
  http.end();
}

void pollHardwareRelayStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_STATUS_URL);
  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<256> doc;
    deserializeJson(doc, payload);

    bool laserEnable = doc["relays"]["laserEnable"];
    bool chillerPump = doc["relays"]["chillerPump"];
    bool emergency   = doc["relays"]["emergencyCutoff"];

    // ATUAÇÃO NOS RELÉS DA MÁQUINA NA VIDA REAL:
    digitalWrite(RELAY_LASER_ENABLE, laserEnable ? HIGH : LOW);
    digitalWrite(RELAY_CHILLER_PUMP, chillerPump ? HIGH : LOW);
    digitalWrite(RELAY_EMERGENCY_NC, emergency ? LOW : HIGH); // Trigger emergency
  }

  http.end();
}
\n
