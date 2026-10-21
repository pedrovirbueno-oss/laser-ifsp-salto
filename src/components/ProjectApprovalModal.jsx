import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Calendar, Clock, FileCode, Sparkles, Printer, MonitorCheck } from 'lucide-react';

export const ProjectApprovalModal = () => {
  const { 
    selectedProjectForApproval, 
    setSelectedProjectForApproval, 
    approveStudentProject 
  } = useApp();

  // Today's date in YYYY-MM-DD so past dates are strictly disabled in the native calendar
  const todayIso = new Date().toISOString().slice(0, 10);

  const [machineId, setMachineId] = useState('LASER-01');
  const [scheduledIsoDate, setScheduledIsoDate] = useState(todayIso);
  const [timeDigits, setTimeDigits] = useState('1430'); // Stored as up to 4 digits, displayed as 14:30
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState(35);
  const [notes, setNotes] = useState('');

  if (!selectedProjectForApproval) return null;

  // Format digits into __:__ mask automatically without needing to type ':'
  const formatMaskedTime = (rawDigits) => {
    const clean = rawDigits.replace(/\D/g, '').slice(0, 4);
    if (clean.length === 0) return '__:__';
    if (clean.length === 1) return `${clean}_:__`;
    if (clean.length === 2) return `${clean}:__`;
    if (clean.length === 3) return `${clean.slice(0, 2)}:${clean[2]}_`;
    return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setTimeDigits(prev => prev.slice(0, -1));
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setTimeDigits(prev => {
        if (prev.length >= 4) return e.key; // Start fresh if already 4 digits
        const next = prev + e.key;
        // Validate hours (00-23) and minutes (00-59)
        if (next.length >= 2) {
          const hh = Number(next.slice(0, 2));
          if (hh > 23) return '23' + next.slice(2);
        }
        if (next.length === 4) {
          const mm = Number(next.slice(2, 4));
          if (mm > 59) return next.slice(0, 2) + '59';
        }
        return next;
      });
    }
  };

  const handleApprove = (e) => {
    e.preventDefault();

    const finalDigits = timeDigits.padEnd(4, '0');
    const formattedTime = `${finalDigits.slice(0, 2)}:${finalDigits.slice(2, 4)}`;

    const [yyyy, mm, dd] = (scheduledIsoDate || todayIso).split('-');
    const formattedBrDate = `${dd}/${mm}/${yyyy}`;

    approveStudentProject(selectedProjectForApproval.id, {
      machineId,
      scheduledDate: formattedBrDate,
      scheduledTime: formattedTime,
      estimatedTimeMinutes: Number(estimatedTimeMinutes),
      notes
    });
    setSelectedProjectForApproval(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight">APROVAÇÃO, AGENDAMENTO & ENVIO À BANCADA</h3>
          </div>
          <button
            onClick={() => setSelectedProjectForApproval(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApprove} className="p-6 space-y-5 overflow-y-auto">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-mono text-slate-400 font-bold">{selectedProjectForApproval.id}</span>
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">PENDENTE DE ANÁLISE</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900">{selectedProjectForApproval.projectTitle}</h4>
            <p><strong>Aluno Solicitante:</strong> {selectedProjectForApproval.studentName} ({selectedProjectForApproval.studentProntuario})</p>
            <p><strong>Curso:</strong> {selectedProjectForApproval.course}</p>
            <p><strong>Material Solic.:</strong> {selectedProjectForApproval.materialType} • {selectedProjectForApproval.totalQuantity} Peça(s)</p>
            
            <div className="pt-2 border-t border-slate-200">
              <p className="font-bold text-slate-700 mb-1">Arquivos que serão enviados sozinhos para o PC da Máquina:</p>
              <div className="space-y-1 font-mono text-[11px] text-indigo-700">
                {selectedProjectForApproval.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 bg-white p-1.5 rounded border border-slate-200">
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div className="space-y-4 pt-1">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              ALOCAÇÃO DE MÁQUINA & CALENDÁRIO DE EXECUÇÃO
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Selecionar Bancada de Corte Laser (Destino Automático) *</span>
              </label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="LASER-01">01 • Laser CO2 LabMaker (Amarela) - Enviar p/ PC Bancada 01</option>
                <option value="LASER-02">02 • Laser CO2 MAFRAN MF-6040 (Azul) - Enviar p/ PC Bancada 02</option>
              </select>
            </div>

            {/* Tempo Estimado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tempo Estimado de Laser (Minutos) *</span>
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={estimatedTimeMinutes}
                onChange={(e) => setEstimatedTimeMinutes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Data (Calendário Nativo travado da data atual p/ frente) & Horário com máscara __:__ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Data Agendada (Calendário) *</span>
                </label>
                <input
                  type="date"
                  min={todayIso}
                  value={scheduledIsoDate}
                  onChange={(e) => setScheduledIsoDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                />
                <span className="text-[10px] text-slate-400 block">Apenas hoje ou datas futuras permitidas</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Horário (Digite apenas números) *</span>
                </label>
                <input
                  type="text"
                  value={formatMaskedTime(timeDigits)}
                  onKeyDown={handleTimeKeyDown}
                  onChange={() => {}}
                  onFocus={() => {
                    if (timeDigits === '1430') setTimeDigits('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-extrabold tracking-widest text-center text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400 block">Máscara automática __:__ (sem digitar :)</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
            <MonitorCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Ao aprovar, a OS e o arquivo CAD já renomeado vão <strong>automaticamente para o computador ao lado da máquina escolhida</strong>.
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>APROVAR, GERAR OS E ENVIAR AO PC DA MÁQUINA</span>
          </button>

        </form>

      </div>

    </div>
  );
};
