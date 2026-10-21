import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { Printer, ArrowLeft, X, Calendar, MonitorCheck, Play } from 'lucide-react';

export const OsPublicVerifyView = ({ osCodeParam, onBack }) => {
  const { workOrders, formatSecondsToHms, machines, assignOsToMachine } = useApp();

  const params = new URLSearchParams(window.location.search);
  const foundOs = workOrders.find((o) => o.code.toUpperCase() === (osCodeParam || '').toUpperCase()) || {
    code: osCodeParam || 'OS-2026-0157',
    materialType: params.get('mat') || 'MDF 6.0mm Naval',
    quantity: params.get('qty') || '2 chapas (900x600mm)',
    estimatedTime: params.get('est') || '01h 15min',
    realCuttingSeconds: Number(params.get('real') || 3120),
    requester: params.get('req') || 'Lucas Almeida (SP308491)',
    operator: params.get('op') || 'Técnico de Laboratório',
    machineId: params.get('mac') || 'LASER-01',
    status: params.get('st') || 'EM_ANDAMENTO',
    createdAt: params.get('dt') || new Date().toLocaleDateString('pt-BR'),
    syncedFiles: [`${osCodeParam || 'OS-2026-0157'}_projeto_corte.dxf`],
    notes: 'Ordem de Serviço verificada digitalmente via QR Code Oficial do Laboratório IFSP Câmpus Salto.'
  };

  const assignedMachine = machines.find((m) => m.id === foundOs.machineId) || machines[0];
  const fullVerifyUrl = window.location.href;

  const handleCloseOsView = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    }
    // If opened as a standalone pop-up tab, also try closing
    try {
      if (window.opener) window.close();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 flex flex-col items-center justify-center font-sans text-slate-800">
      
      {/* Top Action Bar with Clear Close Button */}
      <div className="max-w-xl w-full mb-4 flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <button
          onClick={handleCloseOsView}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>VOLTAR AO SISTEMA / FECHAR OS</span>
        </button>

        <button
          onClick={handleCloseOsView}
          className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
          title="Fechar visualização da OS"
        >
          <X className="w-4 h-4" />
          <span>Fechar Tela</span>
        </button>
      </div>

      <div className="bg-white max-w-xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header Institucional */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="bg-white p-2 rounded-xl shadow-md">
              <img
                src="/assets/logo-ifsp-salto.png"
                alt="IFSP Câmpus Salto"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                FICHA OFICIAL DE ORDEM DE SERVIÇO
              </span>
              <h1 className="text-lg font-extrabold tracking-tight text-white mt-1">
                IFSP CÂMPUS SALTO • LAB. LASER
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full ${
              foundOs.status === 'EM_ANDAMENTO'
                ? 'bg-emerald-500 text-slate-950'
                : foundOs.status === 'CONCLUIDA'
                ? 'bg-blue-500 text-white'
                : 'bg-amber-400 text-slate-950'
            }`}>
              {foundOs.status === 'EM_ANDAMENTO' ? '● EM EXECUÇÃO' : foundOs.status}
            </span>
          </div>
        </div>

        {/* OS Body */}
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CÓDIGO IDENTIFICADOR DA OS
              </p>
              <h2 className="text-3xl font-mono font-extrabold text-slate-900 tracking-wider mt-0.5">
                {foundOs.code}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Emitida em: {foundOs.createdAt}</span>
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <QRCodeSVG value={fullVerifyUrl} size={90} level="M" />
            </div>
          </div>

          {/* Machine Info & Auto-Sync File Info */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <div className="flex items-center space-x-3.5">
              <img
                src={assignedMachine.image}
                alt={assignedMachine.name}
                className="w-16 h-16 rounded-xl object-cover border border-emerald-300 shrink-0"
              />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  EQUIPAMENTO DESIGNADO
                </span>
                <h3 className="text-sm font-bold text-slate-900">{assignedMachine.name}</h3>
                <p className="text-xs text-slate-600 font-mono">{assignedMachine.model}</p>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <MonitorCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Arquivo no PC da Máquina:
              </span>
              <code className="font-mono font-bold text-emerald-800">
                {foundOs.syncedFiles?.[0] || `${foundOs.code}_projeto.dxf`}
              </code>
            </div>
          </div>

          {/* Technical Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Material Utilizado</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{foundOs.materialType}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Quantidade</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{foundOs.quantity}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Aluno / Solicitante</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{foundOs.requester}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Perfil Operador</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{foundOs.operator}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-700 font-bold uppercase block">Tempo Previsto de Corte</span>
              <span className="font-mono font-extrabold text-amber-900 text-sm mt-0.5 block">{foundOs.estimatedTime}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Tempo Real de Máquina</span>
              <span className="font-mono font-extrabold text-emerald-900 text-sm mt-0.5 block">
                {formatSecondsToHms(foundOs.realCuttingSeconds)}
              </span>
            </div>
          </div>

          {foundOs.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Observações da Ordem</span>
              <p className="text-slate-700">{foundOs.notes}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200 print:hidden">
            <button
              onClick={handleCloseOsView}
              className="flex items-center space-x-1.5 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Fechar Ficha da OS</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  assignOsToMachine(foundOs, assignedMachine.id);
                  handleCloseOsView();
                }}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simular Abertura no PC da Máquina</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
