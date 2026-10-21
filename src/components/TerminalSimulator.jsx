import React from 'react';
import { useApp } from '../context/AppContext';
import { ChevronUp, ChevronDown, Play, Pause, Square, CreditCard, Radio, Terminal as TerminalIcon, CheckCircle2, ShieldAlert } from 'lucide-react';

export const TerminalSimulator = ({ compact = false }) => {
  const {
    workOrders,
    machineState,
    terminalState,
    handleTerminalNavigate,
    handleTerminalStart,
    handleTerminalPause,
    handleTerminalStop,
    toggleRfidCard
  } = useApp();

  const availableOs = workOrders.filter(os => os.status !== 'CANCELADA');

  return (
    <div className={`bg-slate-900 rounded-2xl p-5 text-white border-4 border-slate-700 shadow-2xl relative ${compact ? 'max-w-md mx-auto' : 'w-full'}`}>
      
      {/* Screw Heads on Panel Corners (Hardware aesthetic) */}
      <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-slate-800 transform rotate-45"></div>
      </div>
      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-slate-800 transform -rotate-45"></div>
      </div>
      <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-slate-800 transform rotate-12"></div>
      </div>
      <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-slate-800 transform -rotate-12"></div>
      </div>

      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 px-2">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-300">
            TERMINAL IHM ESP32-WROOM-32
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

        {/* OLED DISPLAY SECTION (8 cols) */}
        <div className="md:col-span-7 space-y-3">
          
          {/* Physical OLED Blue Screen Frame */}
          <div className="bg-slate-950 p-4 rounded-xl border-2 border-blue-900 shadow-inner font-mono text-xs text-blue-200 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            
            {/* Screen Header */}
            <div>
              <div className="text-center pb-2 mb-2 border-b border-blue-900/60 font-bold tracking-wider text-blue-300 text-sm">
                SELECIONA A OS
              </div>

              {/* OS List Navigation */}
              <div className="space-y-1 my-2 max-h-[120px] overflow-y-auto">
                {availableOs.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">NENHUMA OS NA FILA</p>
                ) : (
                  availableOs.map((os, idx) => {
                    const isSelected = idx === terminalState.selectedIndex;
                    const isRunning = os.code === machineState.currentOsCode && machineState.status === 'RODANDO';

                    return (
                      <div
                        key={os.code}
                        onClick={() => setTerminalState(prev => ({ ...prev, selectedIndex: idx }))}
                        className={`px-3 py-1.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'hover:bg-blue-950/50 text-blue-300'
                        }`}
                      >
                        <span className="tracking-widest">{os.code}</span>
                        <span className="text-[10px] opacity-80 uppercase">
                          {isRunning ? '▶ EM CORTE' : os.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Screen Footer hint */}
            <div className="pt-2 border-t border-blue-900/60 flex justify-between items-center text-[10px] text-blue-400 font-sans">
              <span>USE AS SETAS PARA NAVEGAR</span>
              <span className="font-mono">
                {availableOs.length > 0 ? `${terminalState.selectedIndex + 1}/${availableOs.length}` : '0/0'}
              </span>
            </div>

          </div>

          {/* OLED Selected OS Details */}
          {availableOs[terminalState.selectedIndex] && (
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Material:</span>
                <span className="text-white font-semibold">{availableOs[terminalState.selectedIndex].materialType}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Solicitante:</span>
                <span className="text-emerald-400">{availableOs[terminalState.selectedIndex].requester}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tempo Previsto:</span>
                <span className="text-amber-400">{availableOs[terminalState.selectedIndex].estimatedTime}</span>
              </div>
            </div>
          )}

        </div>

        {/* PHYSICAL BUTTONS & RFID SECTION (5 cols) */}
        <div className="md:col-span-5 space-y-4">

          {/* Up & Down Arrows */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => handleTerminalNavigate('UP')}
              className="w-16 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 rounded-xl border border-slate-600 flex items-center justify-center text-slate-200 shadow-md cursor-pointer transition-transform active:scale-95"
              title="Navegar Cima"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleTerminalNavigate('DOWN')}
              className="w-16 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 rounded-xl border border-slate-600 flex items-center justify-center text-slate-200 shadow-md cursor-pointer transition-transform active:scale-95"
              title="Navegar Baixo"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Action Push Buttons (Green, Yellow, Red) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            
            {/* GREEN BUTTON: INICIAR / CONCLUIR */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTerminalStart}
                className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border-2 border-emerald-400 shadow-lg flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90 shrink-0"
                title="Iniciar ou Concluir Operação"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
              <div className="text-[10px]">
                <p className="font-bold text-emerald-400 uppercase">INICIAR / CONCLUIR</p>
                <p className="text-slate-400">Inicia ou conclui a OS selecionada</p>
              </div>
            </div>

            {/* YELLOW BUTTON: PAUSAR */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTerminalPause}
                className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 border-2 border-amber-300 shadow-lg flex items-center justify-center text-slate-950 cursor-pointer transition-transform active:scale-90 shrink-0"
                title="Pausar Operação"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
              <div className="text-[10px]">
                <p className="font-bold text-amber-400 uppercase">PAUSAR OPERAÇÃO</p>
                <p className="text-slate-400">Pressionar duas vezes para pausar a OS</p>
              </div>
            </div>

            {/* RED BUTTON: INTERRUMPER */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTerminalStop}
                className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 border-2 border-red-400 shadow-lg flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90 shrink-0"
                title="Interromper OS / Manutenção"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
              <div className="text-[10px]">
                <p className="font-bold text-red-400 uppercase">INTERRUMPER OS</p>
                <p className="text-slate-400">Apertar duas vezes para chamar manutenção</p>
              </div>
            </div>

          </div>

          {/* RFID READER SURFACE */}
          <div
            onClick={toggleRfidCard}
            className={`p-3 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
              terminalState.rfidAuthenticated
                ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Radio className={`w-4 h-4 ${terminalState.rfidAuthenticated ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <CreditCard className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider">
              APROXIME O CARTÃO DE IDENTIFICAÇÃO
            </p>
            <p className="text-[10px] mt-1 font-mono">
              {terminalState.rfidAuthenticated
                ? `✔ Crachá: ${terminalState.operatorName}`
                : 'Clique para Simular Aproximação de Crachá'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
