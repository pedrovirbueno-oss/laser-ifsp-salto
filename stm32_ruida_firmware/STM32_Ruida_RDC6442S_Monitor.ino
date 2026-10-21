/**
 * ============================================================================
 * FIRMWARE OFICIAL STM32F4 (CORTEX-M4) - IFSP CÂMPUS SALTO
 * Leitura Não-Invasiva da Controladora Ruida RDC6442S-B (EC) + Sensor SCT-013
 * ============================================================================
 * Placa Alvo: STM32F401CCU6 / STM32F411CEU6 (Black Pill)
 * Comunicação: USB CDC Virtual COM Port (115200 bps) -> PC da Bancada
 */

#include <Arduino.h>

// IDENTIFICADOR DA BANCADA ("LASER-01" para a Amarela | "LASER-02" para a MAFRAN Azul)
#define MACHINE_ID "LASER-01"

// CALIBRAÇÃO DE PASSOS POR MILÍMETRO DA RUIDA RDC6442S-B
const float PULSES_PER_MM_X = 125.0f;
const float PULSES_PER_MM_Y = 125.0f;

// PINAGEM EXATA CONFORME O GUIA DE MONTAGEM (MÓDULO PC817 -> STM32)
#define PIN_PUL_X     PA0   // OUT1 do PC817 (Pulso Eixo X - Borne AXIS X Pino 2)
#define PIN_DIR_X     PA1   // OUT2 do PC817 (Direção Eixo X - Borne AXIS X Pino 1)
#define PIN_PUL_Y     PB6   // OUT3 do PC817 (Pulso Eixo Y - Borne AXIS Y Pino 2)
#define PIN_DIR_Y     PB7   // OUT4 do PC817 (Direção Eixo Y - Borne AXIS Y Pino 1)
#define PIN_LASER_ON  PB0   // OUT5 do PC817 (Pino L-On1 do borne CN5 da Ruida)
#define PIN_HOME_X    PB1   // OUT6 do PC817 (Fim de curso LmtX- do borne CN4)
#define PIN_HOME_Y    PB2   // OUT7 do PC817 (Fim de curso LmtY- do borne CN4)

// PINO ANALÓGICO DO SENSOR DE CORRENTE NÃO-INVASIVO SCT-013-030 (30A / 1V)
#define PIN_SCT013    PA4   // ADC1_IN4

volatile int32_t stepsX = 0;
volatile int32_t stepsY = 0;
volatile uint32_t totalStepActivity = 0;

void isrPulseX() {
  if (digitalRead(PIN_DIR_X) == HIGH) {
    stepsX++;
  } else {
    stepsX--;
  }
  totalStepActivity++;
}

void isrPulseY() {
  if (digitalRead(PIN_DIR_Y) == HIGH) {
    stepsY++;
  } else {
    stepsY--;
  }
  totalStepActivity++;
}

float readCurrentAmpsRMS() {
  const int samples = 400;
  double sumSquares = 0;
  const float adcMidPoint = 2048.0f;

  for (int i = 0; i < samples; i++) {
    int raw = analogRead(PIN_SCT013);
    float centered = (float)raw - adcMidPoint;
    sumSquares += (centered * centered);
    delayMicroseconds(80);
  }

  float rmsCounts = sqrt(sumSquares / samples);
  float currentAmps = rmsCounts * (3.3f / 4096.0f) * 30.0f;

  if (currentAmps < 0.25f) return 0.0f;
  return currentAmps;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(PIN_PUL_X, INPUT_PULLUP);
  pinMode(PIN_DIR_X, INPUT_PULLUP);
  pinMode(PIN_PUL_Y, INPUT_PULLUP);
  pinMode(PIN_DIR_Y, INPUT_PULLUP);
  pinMode(PIN_LASER_ON, INPUT_PULLUP);
  pinMode(PIN_HOME_X, INPUT_PULLUP);
  pinMode(PIN_HOME_Y, INPUT_PULLUP);
  pinMode(PIN_SCT013, INPUT);

  attachInterrupt(digitalPinToInterrupt(PIN_PUL_X), isrPulseX, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_PUL_Y), isrPulseY, FALLING);
}

uint32_t lastReportMs = 0;

void loop() {
  if (digitalRead(PIN_HOME_X) == LOW && digitalRead(PIN_HOME_Y) == LOW) {
    noInterrupts();
    stepsX = 0;
    stepsY = 0;
    interrupts();
  }

  if (millis() - lastReportMs >= 100) {
    lastReportMs = millis();

    noInterrupts();
    int32_t curStepsX = stepsX;
    int32_t curStepsY = stepsY;
    uint32_t stepDelta = totalStepActivity;
    totalStepActivity = 0;
    interrupts();

    float posX_mm = (float)curStepsX / PULSES_PER_MM_X;
    float posY_mm = (float)curStepsY / PULSES_PER_MM_Y;
    if (posX_mm < 0) posX_mm = 0;
    if (posY_mm < 0) posY_mm = 0;

    bool laserBeamActive = (digitalRead(PIN_LASER_ON) == LOW);
    bool motorsMoving = (stepDelta > 0);
    float currentAmp = readCurrentAmpsRMS();

    if (currentAmp > 3.0f) {
      laserBeamActive = true;
    }

    Serial.print("{\"machineId\":\"");
    Serial.print(MACHINE_ID);
    Serial.print("\",\"x\":");
    Serial.print(posX_mm, 1);
    Serial.print(",\"y\":");
    Serial.print(posY_mm, 1);
    Serial.print(",\"laserOn\":");
    Serial.print(laserBeamActive ? "true" : "false");
    Serial.print(",\"moving\":");
    Serial.print(motorsMoving ? "true" : "false");
    Serial.print(",\"currentAmp\":");
    Serial.print(currentAmp, 2);
    Serial.println("}");
  }
}
