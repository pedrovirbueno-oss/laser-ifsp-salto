import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, Clock, Play, CheckCircle2, User, Layers, QrCode } from 'lucide-react';

export const ProductionPlanView = () => {
  const { workOrders, setSelectedOsForQr, setIsQrModalOpen } = useApp();

  const queued = workOrders.filter(os => os.status === 'AGUARDANDO');
  const running = workOrders.filter(os => os.status === 'EM_ANDAMENTO');
  const completed = workOrders.filter(os => os.status === 'CONCLUIDA');

  return (
    <div className="space-y-6 pb-12">
      
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            <span>PLANO DE PRODUÇÃO E CRONOGRAMA DE CORTE</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organização em Kanban da fila de usinagem laser do laboratório do IFSP Câmpus Salto
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Fila de Espera (Aguardando) */}
        <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>FILA DE ESPERA ({queued.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {queued.map(os => (
              <div key={os.code} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm text-slate-900">{os.code}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">AGUARDANDO</span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Material:</strong> {os.materialType}</p>
                  <p><strong>Previsão:</strong> {os.estimatedTime}</p>
                  <p><strong>Solicitante:</strong> {os.requester}</p>
                </div>
                <button
                  onClick={() => { setSelectedOsForQr(os); setIsQrModalOpen(true); }}
                  className="w-full text-center text-xs bg-slate-50 hover:bg-slate-100 py-1.5 rounded-lg border border-slate-200 font-semibold cursor-pointer"
                >
                  Ver QR Code
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Em Execução */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <h2 className="font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-600 fill-current" />
              <span>EM EXECUÇÃO NA LASER ({running.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {running.map(os => (
              <div key={os.code} className="bg-white p-4 rounded-xl border-2 border-emerald-500 shadow-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm text-emerald-800">{os.code}</span>
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded animate-pulse">● EM CORTE</span>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><strong>Material:</strong> {os.materialType}</p>
                  <p><strong>Operador:</strong> {os.operator}</p>
                  <p><strong>Solicitante:</strong> {os.requester}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Concluídas */}
        <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>CONCLUÍDAS HOJE ({completed.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {completed.map(os => (
              <div key={os.code} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 opacity-90">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm text-slate-900">{os.code}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">CONCLUÍDA</span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Material:</strong> {os.materialType}</p>
                  <p><strong>Operador:</strong> {os.operator}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
