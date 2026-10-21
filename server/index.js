/**
 * ===================================================================================
 * INSTITUTO FEDERAL DE SÃO PAULO - CÂMPUS SALTO
 * SERVIDOR BACKEND E SERVIÇO IOT ESP32 PARA MÁQUINA DE CORTE A LASER CO2
 * ===================================================================================
 * 
 * Funcionalidades:
 *  1. REST API para Autenticação (JWT/Token Crypto), Gestão de OSs e Manutenção.
 *  2. Endpoint IoT para recepção de telemetrias do ESP32 (Corrente ACS712, Temp, MPU6050).
 *  3. Atuação em tempo real na máquina física via relés (Laser WP, Chiller, Emergência).
 *  4. Event Stream (SSE) para atualização em tempo real de clientes web sem polling.
 *  5. Persistência de dados em arquivo JSON em disco.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3001;
const DB_FILE = path.join(__dirname, 'database.json');
const ESP32_SECRET_TOKEN = 'IFSP_SALTO_SECRET_2026';

// List of connected SSE clients (Web browser instances)
let sseClients = [];

// Helper: Read Database
function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB ERROR] Falha ao ler banco de dados JSON:', err);
    return null;
  }
}

// Helper: Write Database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DB ERROR] Falha ao gravar no banco de dados JSON:', err);
    return false;
  }
}

// Helper: Broadcast event to all SSE web clients
function broadcastSse(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

// Helper: Parse JSON Body from Incoming Requests
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
  });
}

// Helper: CORS Headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ESP32-AUTH-TOKEN');
}

// HTTP Server Callback
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  console.log(`[API] ${req.method} ${pathname}`);

  // -----------------------------------------------------------------------------------
  // 1. ROUTE: GET /api/health
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ONLINE', serverTime: new Date().toISOString(), system: 'IFSP Salto Backend' }));
    return;
  }

  // -----------------------------------------------------------------------------------
  // 2. ROUTE: GET /api/stream (Server-Sent Events)
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    sseClients.push(res);
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Conectado ao Stream de Telemetria IFSP Salto' })}\n\n`);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  // -----------------------------------------------------------------------------------
  // 3. ROUTE: POST /api/auth/login
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const db = readDB();
    const body = await parseBody(req);
    const { prontuario, password } = body;

    if (!prontuario || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Prontuário e senha são obrigatórios' }));
      return;
    }

    const user = db.users.find(u => u.prontuario.toUpperCase() === prontuario.toUpperCase());
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Usuário não encontrado' }));
      return;
    }

    // Generate SHA256 Token
    const token = crypto.createHash('sha256').update(`${user.id}-${Date.now()}-secret`).digest('hex');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        prontuario: user.prontuario
      }
    }));
    return;
  }

  // -----------------------------------------------------------------------------------
  // 4. ROUTE: GET /api/work-orders
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/work-orders' && req.method === 'GET') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.workOrders || []));
    return;
  }

  // -----------------------------------------------------------------------------------
  // 5. ROUTE: POST /api/work-orders (Criar Nova OS com QR Code Payload)
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/work-orders' && req.method === 'POST') {
    const db = readDB();
    const body = await parseBody(req);

    const count = db.workOrders.length + 160;
    const code = `OS-2026-0${count}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const newOs = {
      code,
      materialType: body.materialType || 'MDF 3.0mm CRYS',
      quantity: body.quantity || '1 chapa',
      estimatedTime: body.estimatedTime || '30 minutos',
      realCuttingSeconds: 0,
      requester: body.requester || 'Solicitante Geral',
      operator: body.operator || 'Operador Técnico',
      status: 'AGUARDANDO',
      createdAt: formattedDate,
      laserPower: body.laserPower || 65,
      laserSpeed: body.laserSpeed || 18,
      completedPercentage: 0,
      notes: body.notes || 'Ordem de serviço criada via backend Node.js IFSP Salto.'
    };

    db.workOrders.unshift(newOs);
    writeDB(db);

    // Notify connected SSE browser clients
    broadcastSse('work_order_created', newOs);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newOs));
    return;
  }

  // -----------------------------------------------------------------------------------
  // 6. ROUTE: POST /api/esp32/telemetry (Recepção de telemetria de sensores do ESP32)
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/esp32/telemetry' && req.method === 'POST') {
    const body = await parseBody(req);
    const db = readDB();

    // Update real machine sensors in DB
    if (db && db.machine) {
      if (body.currentAmp !== undefined) db.machine.currentAmp = Number(body.currentAmp);
      if (body.chillerTemp !== undefined) db.machine.chillerTemp = Number(body.chillerTemp);
      if (body.vibrationG !== undefined) db.machine.vibrationG = Number(body.vibrationG);
      if (body.waterFlowLmin !== undefined) db.machine.waterFlowLmin = Number(body.waterFlowLmin);
      if (body.airPressureBar !== undefined) db.machine.airPressureBar = Number(body.airPressureBar);
      if (body.hoodOpen !== undefined) db.machine.hoodOpen = Boolean(body.hoodOpen);
      if (body.esp32Ip) db.machine.esp32Ip = body.esp32Ip;
      db.machine.esp32Status = 'CONECTADO';

      // Increment cycle times if machine is running
      if (db.machine.status === 'RODANDO') {
        db.cycleStats.totalOnTimeSeconds += 2;
        db.cycleStats.actualCuttingTimeSeconds += 2;

        // Increment current OS real cutting seconds
        const activeOs = db.workOrders.find(os => os.code === db.machine.currentOsCode);
        if (activeOs) {
          activeOs.realCuttingSeconds = (activeOs.realCuttingSeconds || 0) + 2;
        }
      } else {
        db.cycleStats.totalOnTimeSeconds += 2;
        db.cycleStats.idleTimeSeconds += 2;
      }

      writeDB(db);
      broadcastSse('telemetry_tick', db.machine);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, relays: db.machine.relays }));
    return;
  }

  // -----------------------------------------------------------------------------------
  // 7. ROUTE: POST /api/esp32/actuate (Atuação de comandos em Hardware na Vida Real)
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/esp32/actuate' && req.method === 'POST') {
    const body = await parseBody(req);
    const db = readDB();

    const { action, osCode, operatorName } = body;

    console.log(`[HARDWARE ACTUATION] Command received: ${action} for OS: ${osCode}`);

    if (action === 'START_LASER') {
      db.machine.status = 'RODANDO';
      if (osCode) db.machine.currentOsCode = osCode;
      if (operatorName) db.machine.currentOperator = operatorName;
      db.machine.relays.laserEnable = true;

      // Update OS status in database
      const targetOs = db.workOrders.find(os => os.code === (osCode || db.machine.currentOsCode));
      if (targetOs) targetOs.status = 'EM_ANDAMENTO';

    } else if (action === 'PAUSE_LASER') {
      db.machine.status = 'PAUSADA';
      db.machine.relays.laserEnable = false;

    } else if (action === 'STOP_LASER') {
      db.machine.status = 'PRONTA';
      db.machine.relays.laserEnable = false;
      const targetOs = db.workOrders.find(os => os.code === db.machine.currentOsCode);
      if (targetOs) {
        targetOs.status = 'CONCLUIDA';
        targetOs.completedPercentage = 100;
      }

    } else if (action === 'EMERGENCY_STOP') {
      db.machine.status = 'EMERGENCIA';
      db.machine.relays.laserEnable = false;
      db.machine.relays.emergencyCutoff = true;

    } else if (action === 'RESET_EMERGENCY') {
      db.machine.status = 'PRONTA';
      db.machine.relays.emergencyCutoff = false;
    }

    writeDB(db);
    broadcastSse('machine_state_change', db.machine);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, machine: db.machine }));
    return;
  }

  // -----------------------------------------------------------------------------------
  // 8. ROUTE: GET /api/esp32/status (Leitura do estado dos Relés pelo ESP32)
  // -----------------------------------------------------------------------------------
  if (pathname === '/api/esp32/status' && req.method === 'GET') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: db.machine.status,
      currentOsCode: db.machine.currentOsCode,
      relays: db.machine.relays
    }));
    return;
  }

  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota API não encontrada' }));
});

// Start Server
server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 SERVIDOR BACKEND IFSP CÂMPUS SALTO RODANDO NA PORTA :${PORT}`);
  console.log(`📡 Stream SSE: http://localhost:${PORT}/api/stream`);
  console.log(`🤖 IoT ESP32 Endpoint: http://localhost:${PORT}/api/esp32/telemetry`);
  console.log(`================================================================`);
});
