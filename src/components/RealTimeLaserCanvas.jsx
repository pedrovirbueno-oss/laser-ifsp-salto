import React, { useState, useMemo } from 'react';
import { Crosshair, Flame, Eye, CheckCircle2, Layers } from 'lucide-react';

// Generate intricate simulated mechanical CAD paths with stage metadata
function generatePartSegments(partType) {
  const segments = [];

  const addPolyline = (pts, laserOn = true, stageName = 'Corte de Contorno') => {
    for (let i = 0; i < pts.length - 1; i++) {
      segments.push({
        x1: pts[i][0],
        y1: pts[i][1],
        x2: pts[i + 1][0],
        y2: pts[i + 1][1],
        laserOn,
        stageName
      });
    }
  };

  const addCircle = (cx, cy, r, steps = 28, stageName = 'Furação Interna') => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      pts.push([
        Number((cx + Math.cos(angle) * r).toFixed(1)),
        Number((cy + Math.sin(angle) * r).toFixed(1))
      ]);
    }
    addPolyline(pts, true, stageName);
  };

  const addTravel = (x1, y1, x2, y2, stageName = 'Posicionamento Rápido G0') => {
    segments.push({ x1, y1, x2, y2, laserOn: false, stageName });
  };

  if (partType === 'GEAR_FLANGE') {
    // Etapa 1: Furo Central do Eixo
    addTravel(20, 20, 232, 130, 'Etapa 1/4: Furação Central e Fixação');
    addCircle(200, 130, 32, 36, 'Etapa 1/4: Furo Central do Eixo');

    // Etapa 2: 6 Furos M8 de Fixação
    const boltRadius = 62;
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2;
      const bx = 200 + Math.cos(ang) * boltRadius;
      const by = 130 + Math.sin(ang) * boltRadius;
      const prevSeg = segments[segments.length - 1];
      addTravel(prevSeg.x2, prevSeg.y2, bx + 9, by, `Etapa 2/4: Deslocamento Furo M8 #${k + 1}`);
      addCircle(bx, by, 9, 18, `Etapa 2/4: Furos de Fixação M8 (${k + 1}/6)`);
    }

    // Etapa 3: Usinagem dos Dentes da Engrenagem
    const numTeeth = 20;
    const innerR = 88;
    const outerR = 104;
    const gearPts = [];
    for (let i = 0; i < numTeeth; i++) {
      const baseAngle = (i / numTeeth) * Math.PI * 2;
      const step = (Math.PI * 2) / (numTeeth * 4);
      gearPts.push([200 + Math.cos(baseAngle) * innerR, 130 + Math.sin(baseAngle) * innerR]);
      gearPts.push([200 + Math.cos(baseAngle + step * 0.8) * outerR, 130 + Math.sin(baseAngle + step * 0.8) * outerR]);
      gearPts.push([200 + Math.cos(baseAngle + step * 2.2) * outerR, 130 + Math.sin(baseAngle + step * 2.2) * outerR]);
      gearPts.push([200 + Math.cos(baseAngle + step * 3.0) * innerR, 130 + Math.sin(baseAngle + step * 3.0) * innerR]);
    }
    gearPts.push(gearPts[0]);
    const prevSeg = segments[segments.length - 1];
    addTravel(prevSeg.x2, prevSeg.y2, gearPts[0][0], gearPts[0][1], 'Etapa 3/4: Posicionamento Engrenagem');
    addPolyline(gearPts, true, 'Etapa 3/4: Perfil dos Dentes da Engrenagem');

    // Etapa 4: Contorno Externo Chanfrado e Furos de Canto
    const platePts = [
      [60, 20],
      [340, 20],
      [365, 45],
      [365, 215],
      [340, 240],
      [60, 240],
      [35, 215],
      [35, 45],
      [60, 20]
    ];
    const lastG = segments[segments.length - 1];
    addTravel(lastG.x2, lastG.y2, platePts[0][0], platePts[0][1], 'Etapa 4/4: Contorno Externo Chassi');
    addPolyline(platePts, true, 'Etapa 4/4: Corte de Destaque do Chassi');

    const corners = [[65, 48], [335, 48], [335, 212], [65, 212]];
    corners.forEach(([cx, cy], idx) => {
      const prev = segments[segments.length - 1];
      addTravel(prev.x2, prev.y2, cx + 7, cy, 'Etapa 4/4: Furação de Base');
      addCircle(cx, cy, 7, 16, `Etapa 4/4: Furo de Canto (${idx + 1}/4)`);
    });
  } else {
    // Part 2: Painel Frontal Ventilado Gabinete Robô (Para Máquina 02 - MAFRAN MF-6040)
    addTravel(15, 15, 70, 55, 'Etapa 1/3: Aletas de Ventilação');
    for (let row = 0; row < 4; row++) {
      const y = 55 + row * 38;
      const slotPts = [
        [70, y],
        [175, y],
        [175, y + 14],
        [70, y + 14],
        [70, y]
      ];
      const prev = segments[segments.length - 1];
      if (prev) addTravel(prev.x2, prev.y2, slotPts[0][0], slotPts[0][1], `Etapa 1/3: Aleta #${row + 1}`);
      addPolyline(slotPts, true, `Etapa 1/3: Corte Aleta de Ventilação (${row + 1}/4)`);
    }

    const prev1 = segments[segments.length - 1];
    addTravel(prev1.x2, prev1.y2, 285 + 48, 125, 'Etapa 2/3: Furação de Exaustão');
    addCircle(285, 125, 48, 32, 'Etapa 2/3: Janela Circular Cooler 120mm');

    const fanScrews = [[240, 80], [330, 80], [330, 170], [240, 170]];
    fanScrews.forEach(([sx, sy], idx) => {
      const prev = segments[segments.length - 1];
      addTravel(prev.x2, prev.y2, sx + 4, sy, 'Etapa 2/3: Fixação Cooler');
      addCircle(sx, cyOrSy(sy), 4, 14, `Etapa 2/3: Furo Fixação Cooler (${idx + 1}/4)`);
    });

    const outerBox = [
      [35, 25],
      [365, 25],
      [365, 235],
      [35, 235],
      [35, 25]
    ];
    const prev2 = segments[segments.length - 1];
    addTravel(prev2.x2, prev2.y2, outerBox[0][0], outerBox[0][1], 'Etapa 3/3: Perímetro Final');
    addPolyline(outerBox, true, 'Etapa 3/3: Corte Externo Final do Gabinete');
  }

  return segments;
}

function cyOrSy(val) {
  return val;
}

export const RealTimeLaserCanvas = ({
  machineName = 'Laser CO2',
  partName = 'Flange Redutora Robótica (MDF 6mm)',
  partType = 'GEAR_FLANGE',
  progressPercent = 64.5,
  isRunning = true,
  isUnscheduledCut = false,
  bedSizeLabel = '900 x 600 mm'
}) => {
  const segments = useMemo(() => generatePartSegments(partType), [partType]);
  const [showTravelPaths, setShowTravelPaths] = useState(true);

  // Directly synchronize laser position with the real OS progress percentage (0% -> 100%)
  const clampedPercent = Math.max(0, Math.min(100, Number(progressPercent) || 0));
  const exactStepFloat = (clampedPercent / 100) * (segments.length - 1);
  const currentSegIndex = Math.min(Math.floor(exactStepFloat), segments.length - 1);
  const segFraction = exactStepFloat - currentSegIndex;

  const activeSeg = segments[currentSegIndex] || {
    x1: 200,
    y1: 130,
    x2: 200,
    y2: 130,
    laserOn: true,
    stageName: 'Finalizado'
  };

  // Exact X, Y coordinate of the laser head derived from the real OS progress
  const laserX = activeSeg.x1 + (activeSeg.x2 - activeSeg.x1) * segFraction;
  const laserY = activeSeg.y1 + (activeSeg.y2 - activeSeg.y1) * segFraction;

  const displayX = (laserX * 1.5).toFixed(1);
  const displayY = (laserY * 1.5).toFixed(1);

  // Stage breakdown percentages
  const stages = partType === 'GEAR_FLANGE'
    ? [
        { label: '1. Furo Central', range: [0, 15] },
        { label: '2. Furos M8 (6x)', range: [15, 48] },
        { label: '3. Dentes Engrenagem', range: [48, 82] },
        { label: '4. Corte Chassi Final', range: [82, 100] }
      ]
    : [
        { label: '1. Aletas Ventilação', range: [0, 35] },
        { label: '2. Janela Cooler 120mm', range: [35, 78] },
        { label: '3. Perímetro Gabinete', range: [78, 100] }
      ];

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-lg overflow-hidden text-white">
      {/* Top Telemetry Bar of the CNC Plotter */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Crosshair className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold tracking-wide text-white uppercase">
                MAPA DO CORTE SINCRONIZADO COM A CONTROLADORA (X/Y)
              </span>
              <span className="text-[10px] font-mono bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                {clampedPercent.toFixed(1)}% da Peça Concluída
              </span>
              {isUnscheduledCut && (
                <span className="text-[10px] font-mono bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                  CORTE AVULSO (SEM OS)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Peça: <strong className="text-slate-200">{partName}</strong> • Etapa Atual: <strong className="text-emerald-400">{activeSeg.stageName}</strong>
            </p>
          </div>
        </div>

        {/* Live X / Y Coordinates Readout from Controller */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">X:</span>
            <span className="text-emerald-400 font-extrabold">{displayX} mm</span>
          </div>
          <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">Y:</span>
            <span className="text-emerald-400 font-extrabold">{displayY} mm</span>
          </div>
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold text-[10px] ${
            activeSeg.laserOn && isRunning
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Flame className="w-3.5 h-3.5" />
            <span>{activeSeg.laserOn && isRunning ? 'FEIXE ATIVO' : 'DESLOC. G0'}</span>
          </div>
        </div>
      </div>

      {/* Stage Breakdown Progress Pills */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stages.map((st, idx) => {
          const [minP, maxP] = st.range;
          const isDone = clampedPercent >= maxP;
          const isCurrent = clampedPercent >= minP && clampedPercent < maxP;
          const stagePct = isDone
            ? 100
            : isCurrent
            ? Math.round(((clampedPercent - minP) / (maxP - minP)) * 100)
            : 0;

          return (
            <div
              key={idx}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono flex items-center justify-between ${
                isDone
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                  : isCurrent
                  ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="truncate">{st.label}</span>
              <span className="ml-1 font-extrabold">{stagePct}%</span>
            </div>
          );
        })}
      </div>

      {/* Interactive SVG Laser Bed Viewport */}
      <div className="relative bg-[#090d16] p-3 flex items-center justify-center">
        <svg
          viewBox="0 0 400 260"
          className="w-full h-64 sm:h-72 rounded-xl border border-slate-800/80 bg-[#0b111e]"
        >
          <defs>
            <pattern id={`grid-${partType}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" />
            </pattern>
            <pattern id={`subgrid-${partType}`} width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill={`url(#grid-${partType})`} />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1" />
            </pattern>

            <filter id={`laser-glow-${partType}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="400" height="260" fill={`url(#subgrid-${partType})`} />

          {/* Origin Marker (0,0) */}
          <g transform="translate(12, 12)">
            <line x1="0" y1="0" x2="22" y2="0" stroke="#ef4444" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="0" y2="22" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2.5" fill="#fff" />
            <text x="26" y="4" fill="#64748b" fontSize="8" fontFamily="monospace">X</text>
            <text x="-3" y="32" fill="#64748b" fontSize="8" fontFamily="monospace">Y</text>
          </g>

          {/* 1. Ghost Blueprint (Full Planned Vector Path) */}
          {segments.map((seg, idx) =>
            seg.laserOn ? (
              <line
                key={`ghost-${idx}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#1e3a8a"
                strokeWidth="1.4"
                strokeDasharray="3 2"
                opacity="0.55"
              />
            ) : showTravelPaths ? (
              <line
                key={`ghost-travel-${idx}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="2 3"
                opacity="0.4"
              />
            ) : null
          )}

          {/* 2. Already Cut Path (Synchronized with OS completion %) */}
          {segments.slice(0, currentSegIndex).map((seg, idx) =>
            seg.laserOn ? (
              <line
                key={`cut-${idx}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                filter={`url(#laser-glow-${partType})`}
              />
            ) : showTravelPaths ? (
              <line
                key={`travel-${idx}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#475569"
                strokeWidth="0.9"
                strokeDasharray="2 2"
              />
            ) : null
          )}

          {/* 3. Currently Active Segment Being Cut Right Now */}
          {activeSeg && (
            <line
              x1={activeSeg.x1}
              y1={activeSeg.y1}
              x2={laserX}
              y2={laserY}
              stroke={activeSeg.laserOn ? '#f97316' : '#94a3b8'}
              strokeWidth={activeSeg.laserOn ? '2.8' : '1.0'}
              strokeLinecap="round"
            />
          )}

          {/* 4. Gantry X/Y Guide Rails */}
          <line
            x1="0"
            y1={laserY}
            x2="400"
            y2={laserY}
            stroke="#475569"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.7"
          />
          <line
            x1={laserX}
            y1="0"
            x2={laserX}
            y2="260"
            stroke="#475569"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.7"
          />

          {/* 5. Laser Nozzle Head & Plasma Spark */}
          <g transform={`translate(${laserX}, ${laserY})`}>
            <circle
              cx="0"
              cy="0"
              r="9"
              fill="none"
              stroke={activeSeg.laserOn && isRunning ? '#ef4444' : '#38bdf8'}
              strokeWidth="1.2"
              opacity="0.85"
            />
            {activeSeg.laserOn && isRunning && (
              <>
                <circle cx="0" cy="0" r="5.5" fill="#f97316" opacity="0.5">
                  <animate attributeName="r" values="4;8;4" dur="0.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="0" r="2.8" fill="#ffffff" />
              </>
            )}
            {(!activeSeg.laserOn || !isRunning) && (
              <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />
            )}
          </g>
        </svg>

        {/* Bottom Overlay Legend & Controls */}
        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-1 bg-emerald-400 rounded-full inline-block"></span>
              Vetor Cortado ({clampedPercent.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-1 bg-blue-500 rounded-full inline-block opacity-70"></span>
              Restante ({(100 - clampedPercent).toFixed(0)}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowTravelPaths(!showTravelPaths)}
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3 text-indigo-400" />
              <span>{showTravelPaths ? 'Ocultar G0' : 'Mostrar G0'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
