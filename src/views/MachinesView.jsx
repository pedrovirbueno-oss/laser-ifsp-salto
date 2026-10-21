import React from 'react';
import { useApp } from '../context/AppContext';
import { LaserMachineCard } from '../components/LaserMachineCard';
import { Printer, Layers, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const MachinesView = () => {
  const { machines, selectedMachineFilter, setSelectedMachineFilter } = useApp();

  const visibleMachines = selectedMachineFilter === 'BOTH'
    ? machines
    : machines.filter(m => m.id === selectedMachineFilter);

  return (
    <div className="space-y-6 pb-12">
      
      {/* View Title & Machine Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                2 BANCADAS DE CORTE A LASER HOMOLOGADAS
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Modo Supervisão (Sem Intervenção Remota)
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
              MONITORAMENTO DAS MÁQUINAS DE CORTE A LASER CO2
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Acompanhamento de Corrente Elétrica (A) Não-Invasiva e reconstrução gráfica do corte sincronizada com a OS
            </p>
          </div>
        </div>

        {/* Toggle Switcher: Both vs Machine 1 vs Machine 2 */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSelectedMachineFilter('BOTH')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMachineFilter === 'BOTH'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Ver as Duas Juntas</span>
          </button>

          <button
            onClick={() => setSelectedMachineFilter('LASER-01')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMachineFilter === 'LASER-01'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>01 • Laser LabMaker (Amarela)</span>
          </button>

          <button
            onClick={() => setSelectedMachineFilter('LASER-02')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMachineFilter === 'LASER-02'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>02 • MAFRAN MF-6040 (Azul)</span>
          </button>
        </div>
      </div>

      {/* Machine Cards (1 or 2 depending on selection) */}
      <div className="space-y-8">
        {visibleMachines.map((machine) => (
          <LaserMachineCard key={machine.id} machine={machine} showCanvas={true} />
        ))}
      </div>

      {/* Passive Operational Safety Notice */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-slate-900">Bloqueio de Atuação Remota Ativo (Conformidade NR-12)</h4>
            <p className="text-slate-500">
              Para segurança dos operadores e alunos no laboratório, ajustes de potência, velocidade e parada de emergência são realizados exclusivamente no painel físico de cada máquina.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Telemetria Passiva Segura
        </span>
      </div>

    </div>
  );
};
