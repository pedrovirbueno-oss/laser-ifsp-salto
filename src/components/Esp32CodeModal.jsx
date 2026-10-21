import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Download, Check, Code, Cpu } from 'lucide-react';

export const Esp32CodeModal = () => {
  const { isEsp32CodeModalOpen, setIsEsp32CodeModalOpen, machineState } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isEsp32CodeModalOpen) return null;

  const esp32InoCode = `/*
 * ===================================================================================
 *  INSTITUTO FEDERAL DE SÃO PAULO - CÂMPUS SALTO
 *  SISTEMA DE CONTROLE DE MÁQUINA DE CORTE A LASER CO2 VIA ESP32 E IHM
 * ===================================================================================
 *  Hardware: ESP32 DevKit v1, Display OLED I2C SSD1306 (128x64), Leitor RFID MFRC522,
 *            Buzzer, Pushbuttons (Nav Up, Nav Down, Start, Pause, Stop), Relés de Segurança.
 * ===================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <MFRC522.h>

// Configurações da Rede Wi-Fi do Laboratório IFSP Salto
const char* ssid = "IFSP-WIFI-LAB";
const char* password = "SuaSenhaAqui";
const char* serverApiUrl = "http://192.168.1.100:8080/api/os";

// Pinos do Display OLED SSD1306 I2C
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Pinos do Leitor RFID RC522 SPI
#define SS_PIN 5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

// Botões da Interface IHM
#define BTN_UP 13
#define BTN_DOWN 12
#define BTN_START 14
#define BTN_PAUSE 27
#define BTN_STOP 26

// Saídas para Controle da Máquina
#define RELAY_LASER_ENABLE 32
#define RELAY_CHILLER_PUMP 33
#define BUZZER_PIN 25

// Estado Interno
String selectedOsCode = "OS-2026-0157";
bool rfidAuthorized = false;
String operatorName = "";

void setup() {
  Serial.begin(115200);
  
  // Configuração dos Pinos
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_START, INPUT_PULLUP);
  pinMode(BTN_PAUSE, INPUT_PULLUP);
  pinMode(BTN_STOP, INPUT_PULLUP);
  
  pinMode(RELAY_LASER_ENABLE, OUTPUT);
  pinMode(RELAY_CHILLER_PUMP, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(RELAY_LASER_ENABLE, LOW); // Seguro Desligado
  digitalWrite(RELAY_CHILLER_PUMP, HIGH); // Ativa Chiller por Padrão

  // Inicializa Display OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("Falha ao inicializar OLED SSD1306"));
    for (;;);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("IFSP CAMPUS SALTO");
  display.println("Iniciando Terminal...");
  display.display();

  // Conecta ao Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("ESP32 Conectado! IP: ");
  Serial.println(WiFi.localIP());

  // Inicializa RFID SPI
  SPI.begin();
  rfid.PCD_Init();

  updateDisplayUI("SELECIONA A OS", selectedOsCode);
}

void loop() {
  // 1. Leitura de Cartão RFID
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    tone(BUZZER_PIN, 2000, 100);
    rfidAuthorized = true;
    operatorName = "Joao Silva";
    updateDisplayUI("RFID OK: " + operatorName, selectedOsCode);
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // 2. Leitura dos Botões
  if (digitalRead(BTN_START) == LOW) {
    if (rfidAuthorized) {
      digitalWrite(RELAY_LASER_ENABLE, HIGH); // Libera o corte
      tone(BUZZER_PIN, 1500, 200);
      sendStatusToServer(selectedOsCode, "EM_ANDAMENTO");
      updateDisplayUI("EM CORTE...", selectedOsCode);
    } else {
      tone(BUZZER_PIN, 500, 400); // Alerta de erro
      updateDisplayUI("APROXIME O CRACHA!", selectedOsCode);
    }
    delay(300);
  }

  if (digitalRead(BTN_PAUSE) == LOW) {
    digitalWrite(RELAY_LASER_ENABLE, LOW); // Pausa corte
    tone(BUZZER_PIN, 1000, 150);
    sendStatusToServer(selectedOsCode, "PAUSADA");
    updateDisplayUI("OS PAUSADA", selectedOsCode);
    delay(300);
  }

  if (digitalRead(BTN_STOP) == LOW) {
    digitalWrite(RELAY_LASER_ENABLE, LOW);
    tone(BUZZER_PIN, 800, 500);
    sendStatusToServer(selectedOsCode, "CONCLUIDA");
    updateDisplayUI("OS CONCLUIDA", selectedOsCode);
    delay(300);
  }

  delay(50);
}

void updateDisplayUI(String header, String osCode) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("====================");
  display.println(header);
  display.println("====================");
  display.setCursor(0, 24);
  display.setTextSize(2);
  display.println(osCode);
  display.setTextSize(1);
  display.setCursor(0, 52);
  display.println("SETAS: NAVEGAR");
  display.display();
}

void sendStatusToServer(String osCode, String status) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverApiUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["osCode"] = osCode;
    doc["status"] = status;
    doc["esp32Ip"] = WiFi.localIP().toString();

    String jsonOutput;
    serializeJson(doc, jsonOutput);

    int httpCode = http.POST(jsonOutput);
    http.end();
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(esp32InoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([esp32InoCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'IFSP_Salto_Laser_ESP32_Terminal.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm tracking-tight">CÓDIGO FONTE C++ PARA MICROCONTROLADOR ESP32</h3>
          </div>
          <button
            onClick={() => setIsEsp32CodeModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-100 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Arquivo: <strong className="font-mono text-slate-900">IFSP_Salto_Laser_ESP32_Terminal.ino</strong></span>
          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">Pronto para Arduino IDE</span>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-emerald-400 grow">
          <pre className="whitespace-pre-wrap">{esp32InoCode}</pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo .ino</span>
          </button>
        </div>

      </div>
    </div>
  );
};
