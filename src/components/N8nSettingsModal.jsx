import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, CheckCircle2, Mail, Workflow, RefreshCw } from 'lucide-react';

export const N8nSettingsModal = () => {
  const { isN8nModalOpen, setIsN8nModalOpen, n8nConfig } = useApp();

  if (!isN8nModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm tracking-tight">AUTOMAÇÃO DE BACKEND E NOTIFICAÇÕES (N8N)</h3>
          </div>
          <button
            onClick={() => setIsN8nModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Active Webhooks List */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-4 h-4 text-indigo-600" />
              <span>ENDPOINTS DE WEBHOOK N8N CONFIGURADOS</span>
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">1. Novo Projeto Recebido (Confirmação ao Aluno)</span>
                <span className="font-bold text-indigo-700">{n8nConfig.webhookNewRequest}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">2. Projeto Aprovado com Agendamento & QR Code</span>
                <span className="font-bold text-emerald-700">{n8nConfig.webhookApproved}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">3. Peça Pronta para Retirada no Bloco C</span>
                <span className="font-bold text-blue-700">{n8nConfig.webhookCompleted}</span>
              </div>
            </div>
          </div>

          {/* Triggered Automation Log Stream */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>HISTÓRICO DE E-MAILS DISPARADOS VIA N8N</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {n8nConfig.triggeredLogs.map(log => (
                <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{log.event}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 font-sans">Para: <strong className="text-slate-900">{log.recipient}</strong></p>
                  <p className="text-slate-500 font-sans italic">{log.subject}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
