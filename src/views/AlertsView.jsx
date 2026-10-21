import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export const AlertsView = () => {
  const { alerts } = useApp();

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-600" />
          <span>CENTRAL DE NOTIFICAÇÕES E HISTÓRICO DE EVENTOS</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Registro em tempo real de requisições enviadas por alunos, emissão de Ordens de Serviço e alertas de monitoramento
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
                alert.type === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : alert.type === 'WARNING'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : alert.type === 'ERROR'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="mt-0.5">
                {alert.type === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {alert.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {alert.type === 'ERROR' && <XCircle className="w-5 h-5 text-red-600" />}
                {alert.type === 'INFO' && <Info className="w-5 h-5 text-slate-500" />}
              </div>
              <div className="grow">
                <p className="font-semibold text-sm">{alert.message}</p>
                <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
