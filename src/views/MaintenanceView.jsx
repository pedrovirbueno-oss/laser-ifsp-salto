import React from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export const MaintenanceView = () => {
  const { machines } = useApp();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-600" />
            <span>CRONOGRAMA DE MANUTENÇÃO PREVENTIVA E CONSUMÍVEIS</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Acompanhamento de vida útil dos tubos de laser CO2, alinhamento óptico e consumo de corrente das duas máquinas
          </p>
        </div>

        <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Inspeção Preventiva em Dia</span>
        </span>
      </div>

      {/* CONSUMABLES & TUBE HOURS PER MACHINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {machines.map((machine) => {
          const lifePercent = ((2000 - machine.laserTubeHours) / 2000 * 100).toFixed(1);
          const usedPercent = ((machine.laserTubeHours / 2000) * 100).toFixed(1);

          return (
            <div key={machine.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={machine.image}
                    alt={machine.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{machine.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{machine.model}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {lifePercent}% Vida Útil
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Horas Acumuladas do Tubo Laser CO2</span>
                  <span className="font-mono text-emerald-700 font-bold">{machine.laserTubeHours}h / 2000h</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${usedPercent}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Restam {(2000 - machine.laserTubeHours).toFixed(1)} horas estimadas antes da substituição preventiva
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Corrente Atual (A)</span>
                  <span className="font-mono font-extrabold text-amber-700 text-base">{machine.currentAmp} A</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Responsável</span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">{machine.currentOperator}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OPTICAL & MECHANICAL CHECKLIST */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
          CHECKLIST DE LIMPEZA ÓPTICA E LUBRIFICAÇÃO MECÂNICA DAS BANCADAS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-medium text-slate-800">Limpeza de Lentes de Foco ZnSe (Máquina 01 e 02)</span>
            <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Realizada
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-medium text-slate-800">Alinhamento de Espelhos Refletores 1, 2 e 3</span>
            <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Alinhados
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-medium text-slate-800">Inspeção do Sensor Indutivo Não-Invasivo de Corrente</span>
            <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Calibrado
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-medium text-slate-800">Lubrificação das Guias Lineares X/Y e Correias</span>
            <span className="text-amber-700 font-bold font-mono flex items-center gap-1">
              <Clock className="w-4 h-4" /> Programada p/ Sexta-feira
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
