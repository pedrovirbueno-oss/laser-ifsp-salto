import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { X, Printer, ExternalLink, QrCode as QrIcon, CheckCircle2, Copy, MonitorCheck } from 'lucide-react';

export const QRCodeModal = () => {
  const { isQrModalOpen, setIsQrModalOpen, selectedOsForQr, addAlert } = useApp();

  if (!isQrModalOpen || !selectedOsForQr) return null;

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const queryParams = new URLSearchParams({
    os: selectedOsForQr.code,
    mat: selectedOsForQr.materialType || '',
    qty: selectedOsForQr.quantity || '',
    est: selectedOsForQr.estimatedTime || '',
    real: String(selectedOsForQr.realCuttingSeconds || 0),
    req: selectedOsForQr.requester || '',
    op: selectedOsForQr.operator || '',
    mac: selectedOsForQr.machineId || 'LASER-01',
    st: selectedOsForQr.status || 'AGUARDANDO',
    dt: selectedOsForQr.createdAt || ''
  });

  const osDirectUrl = `${baseUrl}?${queryParams.toString()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenOsLink = () => {
    window.open(osDirectUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(osDirectUrl);
    addAlert('SUCCESS', `Link direto da ${selectedOsForQr.code} copiado para a área de transferência.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header with Clear Close Button */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight">QR CODE OFICIAL DA ORDEM DE SERVIÇO</h3>
          </div>
          <button
            onClick={() => setIsQrModalOpen(false)}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6 space-y-4 text-center" id="printable-qr">
          <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            IFSP Câmpus Salto • Laboratório de Prototipagem e Laser
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">CÓDIGO DA ORDEM DE SERVIÇO</p>
            <h2 className="text-3xl font-mono font-extrabold text-slate-900 mt-0.5 tracking-wider">
              {selectedOsForQr.code}
            </h2>
          </div>

          {/* Real Scannable QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-inner inline-block mx-auto">
            <QRCodeSVG
              value={osDirectUrl}
              size={180}
              level="M"
              includeMargin={true}
            />
            <span className="text-[10px] font-mono text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Escaneie com a câmera para abrir a OS
            </span>
          </div>

          {/* Auto-Sync Banner */}
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-left text-[11px] flex items-center gap-2 text-emerald-900">
            <MonitorCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block">Sincronizado c/ PC de Corte da Máquina:</span>
              <code className="font-mono text-[10px] text-emerald-700">
                {selectedOsForQr.syncedFiles?.[0] || `${selectedOsForQr.code}_projeto.dxf`}
              </code>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 font-sans">
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-medium">Máquina Designada:</span>
              <span className="font-bold text-slate-900">
                {selectedOsForQr.machineId === 'LASER-02' ? '02 - MAFRAN MF-6040 (Azul)' : '01 - Laser LabMaker (Amarela)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-medium">Material Usado:</span>
              <span className="font-bold text-slate-900">{selectedOsForQr.materialType}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-medium">Quantidade:</span>
              <span className="font-semibold text-slate-800">{selectedOsForQr.quantity}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-medium">Tempo Previsto:</span>
              <span className="font-semibold text-amber-700">{selectedOsForQr.estimatedTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-medium">Solicitante:</span>
              <span className="font-semibold text-slate-800">{selectedOsForQr.requester}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Perfil Operador:</span>
              <span className="font-semibold text-slate-800">{selectedOsForQr.operator}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            onClick={() => setIsQrModalOpen(false)}
            className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
            >
              <Copy className="w-4 h-4 text-slate-600" />
              <span>Link</span>
            </button>

            <button
              onClick={handleOpenOsLink}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir OS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
