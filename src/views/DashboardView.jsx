import React from 'react';
import { useApp } from '../context/AppContext';
import { LaserMachineCard } from '../components/LaserMachineCard';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  FileText, 
  Printer, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers,
  Timer,
  MonitorCheck
} from 'lucide-react';

export const DashboardView = () => {
  const { 
    workOrders, 
    machines,
    selectedMachineFilter,
    setSelectedMachineFilter,
    telemetryHistory, 
    alerts, 
    setActiveTab, 
    cycleStats,
    formatSecondsToHms,
    benchPcQueue
  } = useApp();

  const activeOsCount = workOrders.filter(os => os.status === 'EM_ANDAMENTO').length;
  const pendingOsCount = workOrders.filter(os => os.status === 'AGUARDANDO').length;
  const runningMachinesCount = machines.filter(m => m.status === 'RODANDO').length;

  const visibleMachines = selectedMachineFilter === 'BOTH'
    ? machines
    : machines.filter(m => m.id === selectedMachineFilter);

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOP KPI METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: ORDENS EM ANDAMENTO */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordens em Execução</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{activeOsCount}</span>
              <span className="text-xs text-slate-500 font-medium">de {workOrders.length} registradas</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>● Fila: {pendingOsCount} aguardando</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: MÁQUINAS EM OPERAÇÃO */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Máquinas Cadastradas</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                {runningMachinesCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">de 2 operando agora</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">01 LabMaker Amarela • 02 MAFRAN Azul</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: TEMPO TRABALHADO NO CICLO */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trabalho Efetivo (Ciclo)</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {formatSecondsToHms(cycleStats.actualCuttingTimeSeconds)}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold">
              Tempo ligada: {formatSecondsToHms(cycleStats.totalOnTimeSeconds)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Timer className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: CORRENTE ELÉTRICA NÃO-INVASIVA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corrente Monitorada (A)</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold text-amber-600 font-mono">M1: {machines[0]?.currentAmp}A</span>
              <span className="text-slate-300">|</span>
              <span className="text-lg font-extrabold text-blue-600 font-mono">M2: {machines[1]?.currentAmp}A</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Sensor Indutivo Não-Invasivo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* MACHINE FILTER BAR (ALTERNAR ENTRE AS MÁQUINAS OU VER AS DUAS JUNTAS) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>BANCADAS DE CORTE A LASER DO LABORATÓRIO</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              {selectedMachineFilter === 'BOTH' ? 'VISUALIZANDO AMBAS JUNTAS' : 'VISUALIZAÇÃO INDIVIDUAL'}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Alterne abaixo para inspecionar cada equipamento individualmente ou acompanhe as duas máquinas simultaneamente
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedMachineFilter('BOTH')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              selectedMachineFilter === 'BOTH'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Ver as Duas Juntas</span>
          </button>

          <button
            onClick={() => setSelectedMachineFilter('LASER-01')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              selectedMachineFilter === 'LASER-01'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-900/20"></span>
            <span>Máquina 01 (Amarela LabMaker)</span>
          </button>

          <button
            onClick={() => setSelectedMachineFilter('LASER-02')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              selectedMachineFilter === 'LASER-02'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/20"></span>
            <span>Máquina 02 (MAFRAN MF-6040 Azul)</span>
          </button>
        </div>
      </div>

      {/* MACHINES DISPLAY */}
      <div className="space-y-6">
        {visibleMachines.map(machine => (
          <LaserMachineCard key={machine.id} machine={machine} showCanvas={true} />
        ))}
      </div>

      {/* TELEMETRY CHART (STRICTLY CURRENT IN AMPERES) & BENCH PC SYNC / NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Real-time Electric Current Telemetry Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>HISTÓRICO DE CORRENTE ELÉTRICA CONSUMIDA (A) - NÃO-INVASIVO</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Leitura contínua das 2 máquinas (Corrente &gt; 3.0A confirma emissão real do feixe laser)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  M01: {machines[0]?.currentAmp} A
                </span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  M02: {machines[1]?.currentAmp} A
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="currGrad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="currGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 8]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="correnteM1" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#currGrad1)" name="Corrente M01 Amarela (A)" />
                  <Area type="monotone" dataKey="correnteM2" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#currGrad2)" name="Corrente M02 MAFRAN (A)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bench PC Automatic Queue Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <MonitorCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  ARQUIVOS ENVIADOS AUTOMATICAMENTE AO PC AO LADO DAS MÁQUINAS
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                SINCRONIZAÇÃO AUTOMÁTICA ATIVA
              </span>
            </div>

            <div className="space-y-2">
              {benchPcQueue.slice(0, 4).map(item => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900">{item.osCode}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">
                        {item.machineId === 'LASER-02' ? 'PC Bancada 02 (MAFRAN)' : 'PC Bancada 01 (Amarela)'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                      Arquivo pronto: <strong>{item.files.join(', ')}</strong> • Aluno: {item.requester}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    ✔ {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Section: Recent Notifications & Events (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>NOTIFICAÇÕES EM TEMPO REAL</span>
              </h3>
              <button 
                onClick={() => setActiveTab('alerts')}
                className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    alert.type === 'SUCCESS' 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                      : alert.type === 'WARNING'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : alert.type === 'ERROR'
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {alert.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {alert.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {alert.type === 'ERROR' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {alert.type === 'INFO' && <Clock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="grow">
                    <p className="font-semibold leading-snug">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
