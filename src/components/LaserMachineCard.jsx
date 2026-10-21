import React from 'react';
import { useApp } from '../context/AppContext';
import { RealTimeLaserCanvas } from './RealTimeLaserCanvas';
import { 
  Zap, 
  FileCheck, 
  QrCode,
  Eye,
  MonitorCheck,
  AlertTriangle
} from 'lucide-react';

export const LaserMachineCard = ({ machine, showCanvas = true }) => {
  const { 
    setSelectedOsForQr, 
    setIsQrModalOpen,
    workOrders,
    formatSecondsToHms,
    triggerUnscheduledCut
  } = useApp();

  if (!machine) return null;

  const currentOs = workOrders.find(os => os.code === machine.currentOsCode);

  const getStatusBadge = (status, isUnscheduled) => {
    if (isUnscheduled) {
      return (
        <span className="flex items-center space-x-1.5 bg-amber-500 text-slate-950 font-extrabold text-xs px-3 py-1 rounded-full shadow-xs animate-pulse">
          <span>⚡ CORTE AVULSO (SEM OS)</span>
        </span>
      );
    }
    switch (status) {
      case 'RODANDO':
        return (
          <span className="flex items-center space-x-1.5 bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>● EM CORTE LASER</span>
          </span>
        );
      case 'PAUSADA':
        return (
          <span className="flex items-center space-x-1.5 bg-amber-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs">
            <span>❚❚ PAUSADA</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 bg-slate-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs">
            <span>○ DISPONÍVEL / STANDBY</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      
      {/* Top Machine Header Bar */}
      <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm border ${
            machine.badgeColor === 'amber'
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
              : 'bg-blue-500/20 border-blue-400/50 text-blue-300'
          }`}>
            {machine.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight text-white leading-tight">
                {machine.name}
              </h3>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                MONITORAMENTO NÃO-INVASIVO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Modelo: {machine.model} • {machine.campus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerUnscheduledCut(machine.id)}
            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            title="Simular que o operador iniciou um corte emergencial direto na máquina sem OS apontada"
          >
            Simular Corte Sem OS
          </button>
          {getStatusBadge(machine.status, machine.isUnscheduledCut)}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Machine Real Photo & Tube Lifetime (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="relative rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200/80 flex items-center justify-center h-60">
              <img 
                src={machine.image} 
                alt={machine.name} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/15">
                Mesa Útil: {machine.bedSize}
              </div>
            </div>

            {/* Bench PC Auto-Sync Status */}
            <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <MonitorCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium truncate">
                  PC Bancada: <strong className="font-mono text-slate-900">{machine.syncedFileOnBenchPc}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                AUTO-SYNC
              </span>
            </div>
          </div>

          {/* Operating OS & Strictly Electric Current (A) Telemetry (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">

            {/* Active OS Card Details */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              machine.isUnscheduledCut
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {machine.isUnscheduledCut ? 'OPERAÇÃO DETECTADA SEM OS APONTADA' : 'ORDEM DE SERVIÇO RECONHECIDA NA BANCADA'}
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5 flex-wrap">
                    {machine.isUnscheduledCut ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className={`font-mono text-base font-extrabold ${
                      machine.isUnscheduledCut ? 'text-amber-800' : 'text-emerald-700'
                    }`}>
                      {machine.currentOsCode}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      • {machine.currentPartName}
                    </span>
                  </div>
                </div>

                {currentOs && (
                  <button
                    onClick={() => {
                      setSelectedOsForQr(currentOs);
                      setIsQrModalOpen(true);
                    }}
                    className="flex items-center space-x-1 text-xs bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl font-bold cursor-pointer shadow-2xs shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>QR Code da OS</span>
                  </button>
                )}
              </div>

              {/* Synchronized Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Progresso Real Sincronizado (Posição X/Y da Controladora)</span>
                  <span className="font-mono font-extrabold text-emerald-700">{machine.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${machine.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Operator (Impersonal) & Student Requester (Real Name) Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Perfil Operador</p>
                  <p className="font-bold text-slate-800 truncate">{machine.currentOperator}</p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Solicitante</p>
                  <p className="font-bold text-slate-800 truncate">{machine.currentRequester}</p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Tempo Real Usado</p>
                  <p className="font-mono font-bold text-emerald-700">
                    {currentOs ? formatSecondsToHms(currentOs.realCuttingSeconds) : '00h 08min 24s'}
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Material</p>
                  <p className="font-bold text-slate-800 truncate">{machine.currentMaterial}</p>
                </div>
              </div>

            </div>

            {/* TELEMETRY METRICS: STRICTLY ELECTRIC CURRENT (A) NON-INVASIVE */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">
                  CORRENTE ELÉTRICA CONSUMIDA (SENSOR NÃO-INVASIVO)
                </span>
                <div className="flex items-baseline gap-3">
                  <p className="font-mono text-3xl font-extrabold text-slate-900">
                    {machine.currentAmp} A
                  </p>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {machine.currentAmp > 3.0 ? '● FEIXE LASER ATIVO (> 3.0A)' : '○ STANDBY (< 2.0A)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Leitura por indução externa no cabo de alimentação geral (identifica automaticamente quando o tubo laser está cortando)
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0">
                <Zap className="w-7 h-7" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Monitoramento passivo sincronizado com o PC de corte ao lado da máquina.
              </span>
              <span className="font-mono text-slate-500">Vida Útil Tubo: {machine.laserTubeHours}h / 2000h</span>
            </div>

          </div>

        </div>

        {/* Real-time 2D Laser Head Trajectory Synchronized with OS Completion % */}
        {showCanvas && (
          <RealTimeLaserCanvas
            machineName={machine.name}
            partName={machine.currentPartName}
            partType={machine.partType}
            progressPercent={machine.progress}
            isRunning={machine.status === 'RODANDO'}
            isUnscheduledCut={machine.isUnscheduledCut}
            bedSizeLabel={machine.bedSize}
          />
        )}
      </div>

    </div>
  );
};
