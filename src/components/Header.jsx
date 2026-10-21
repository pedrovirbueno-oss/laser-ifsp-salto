import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, Clock, Bell, Layers, CheckCircle2 } from 'lucide-react';

export const Header = () => {
  const { machines, selectedMachineFilter, setSelectedMachineFilter, alerts, setActiveTab } = useApp();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTimeStr(`${date} ${time}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const runningCount = machines.filter(m => m.status === 'RODANDO').length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Section: IFSP Câmpus Salto Logo & Title */}
        <div className="flex items-center space-x-4">
          <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center">
            <img 
              src="/assets/logo-ifsp-salto.png" 
              alt="IFSP Câmpus Salto Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                IFSP CÂMPUS SALTO
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">Laboratório Maker & Manufatura Digital</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              SISTEMA DE SUPERVISÃO DE CORTE A LASER
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Monitoramento Não-Invasivo de Corrente (A) e Trajetória CNC (X/Y) em Tempo Real
            </p>
          </div>
        </div>

        {/* Center: Quick Machine Selector Switcher (Alternar entre Máquinas ou Ambas) */}
        <div className="hidden xl:flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setSelectedMachineFilter('BOTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMachineFilter === 'BOTH'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ambas as Máquinas (2)</span>
          </button>

          <button
            onClick={() => setSelectedMachineFilter('LASER-01')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMachineFilter === 'LASER-01'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>01 • Laser Amarela</span>
          </button>

          <button
            onClick={() => setSelectedMachineFilter('LASER-02')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMachineFilter === 'LASER-02'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>02 • MAFRAN MF-6040</span>
          </button>
        </div>

        {/* Right Section: Status, Notifications Bell & Clock */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2.5 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Bancada Laser</p>
              <p className="text-xs font-extrabold text-emerald-950">
                {runningCount} de 2 Máquinas Ativas
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('alerts')}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            title="Central de Notificações"
          >
            <Bell className="w-5 h-5" />
            {unresolvedAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {unresolvedAlerts}
              </span>
            )}
          </button>

          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end text-[11px] font-semibold text-slate-400 gap-1">
              <Clock className="w-3 h-3" />
              <span>HORÁRIO OFICIAL</span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 mt-0.5">
              {timeStr || 'Carregando...'}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
};
