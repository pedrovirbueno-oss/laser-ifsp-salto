# NEXO Production — REST API Specifications for Industrial IoT Integration

## Overview
This specification details endpoints prepared for machine-to-machine telemetry, automated CLP/ESP32 sensor data ingestion, and ERP integration.

## Endpoints

### 1. Telemetry Data Ingestion
- **POST** `/api/telemetry`
- **Headers**: `x-api-key: <YOUR_API_KEY>`
- **Payload**:
```json
{
  "machine_code": "CNC-01",
  "timestamp": "2026-09-04T10:30:00Z",
  "metrics": {
    "production_count": 100,
    "scrap_count": 2,
    "running": true
  }
}
```

### 2. Record Production Batch
- **POST** `/api/production`
- **Payload**:
```json
{
  "machine_id": "30000000-0000-0000-0000-000000000001",
  "order_id": "op-1",
  "produced_quantity": 50,
  "rejected_quantity": 1
}
```

### 3. Record Machine Downtime
- **POST** `/api/downtime`
- **Payload**:
```json
{
  "machine_id": "30000000-0000-0000-0000-000000000001",
  "reason_id": "20000000-0000-0000-0000-000000000001",
  "notes": "Parada técnica para ajuste de zeramento"
}
```

### 4. Query Machine Current Status
- **GET** `/api/machines/:id/status`
