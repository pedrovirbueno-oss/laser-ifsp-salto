/**
 * ============================================================================
 * AGENTE AUTOMÁTICO DO PC DE CORTE (RODA NO PC AO LADO DA MÁQUINA LASER)
 * IFSP CÂMPUS SALTO - INTEGRAÇÃO RUIDA RDC6442S-B + STM32 USB
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const BENCH_MACHINE_ID = process.env.MACHINE_ID || 'LASER-01';
const WATCH_FOLDER = path.join('C:', 'Projetos_Laser_IFSP', 'Fila_Aprovada');

if (!fs.existsSync(WATCH_FOLDER)) {
  fs.mkdirSync(WATCH_FOLDER, { recursive: true });
}

console.log(`================================================================`);
console.log(`💻 AGENTE DA BANCADA ${BENCH_MACHINE_ID} INICIADO`);
console.log(`📂 Pasta de Recebimento Automático de OS: ${WATCH_FOLDER}`);
console.log(`================================================================`);

fs.watch(WATCH_FOLDER, (eventType, filename) => {
  if (!filename) return;
  const match = filename.match(/(OS-\d{4}-\d+)/i);
  if (match) {
    const detectedOs = match[1].toUpperCase();
    console.log(`[AUTO-DETECT] Arquivo ${filename} aberto na bancada -> Vinculado à ${detectedOs}`);
  }
});
