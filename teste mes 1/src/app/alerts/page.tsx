'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/types';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const { company } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'al-1',
      company_id: company?.id || '00000000-0000-0000-0000-000000000001',
      type: 'downtime_limit',
      severity: 'warning',
      title: 'Máquina Parada Acima do Limite',
      message: 'A máquina CNC-03 está parada por mais de 25 minutos (Setup de Ferramental).',
      read: false,
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'al-2',
      company_id: company?.id || '00000000-0000-0000-0000-000000000001',
      type: 'scrap_limit',
      severity: 'danger',
      title: 'Refugo Acima da Meta',
      message: 'A ordem OP-2026-0842 apresentou índice de refugo de 3.2% (meta máxima: 2.0%).',
      read: false,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ]);

  const markAllRead = () => {
    setAlerts(alerts.map((a) => ({ ...a, read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Central de Alertas Operacionais</h1>
              <p className="text-xs text-slate-400">Notificações automáticas de desvios, paradas prolongadas e limites de refugo.</p>
            </div>
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300"
            >
              Marcar todos como lidos
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                  a.severity === 'danger'
                    ? 'bg-red-950/30 border-red-800/60 text-red-200'
                    : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-white text-sm mb-0.5">{a.title}</h3>
                    <p className="text-xs text-slate-300 mb-1">{a.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
