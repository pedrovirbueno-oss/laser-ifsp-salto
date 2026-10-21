import React from 'react';
import { useApp } from '../context/AppContext';
import { TerminalSimulator } from '../components/TerminalSimulator';
import { Terminal as TerminalIcon, Code, Wifi, Cpu, Download, RefreshCw, Send } from 'lucide-react';

export const TerminalView = () => {
  const { terminalState, machineState, setIsEsp32CodeModalOpen, addTerminalLog } = useApp();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xl">
            <TerminalIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              TERMINAL IHM ESP32 & CONEXÃO FÍSICA
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Simulador em tempo real do painel da máquina de corte a laser (OLED + Botões + RFID)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEsp32CodeModalOpen(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Code className="w-4 h-4" />
          <span>Baixar Código C++ (.ino) para ESP32</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Full Size Interactive Hardware Terminal (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Painel IHM Físico (Interativo)
          </h2>

          <TerminalSimulator compact={false} />
        </div>

        {/* Live ESP32 Console Stream & Network Config (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Live Terminal Console Log Stream */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4" />
                <span>ESP32 REALTIME LOG STREAM</span>
              </div>
              <button
                onClick={() => addTerminalLog(`[ESP32 PING] Ping test to ${machineState.esp32Ip} - RTT: 4ms`)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 cursor-pointer"
              >
                Simular Ping HTTP
              </button>
            </div>

            <div className="h-64 overflow-y-auto space-y-1.5 pr-2">
              {terminalState.logs.map((log, i) => (
                <div key={i} className="text-slate-300 hover:text-white transition-colors">
                  <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString('pt-BR')}]</span>
                  <span className={log.includes('DENIED') || log.includes('EMERGENCY') ? 'text-red-400 font-bold' : log.includes('SUCCESS') || log.includes('START') ? 'text-emerald-400' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Network Connection Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>PARÂMETROS DA CONEXÃO DE REDE DO ESP32</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium">Endereço IP Local</span>
                <p className="font-mono font-bold text-slate-900">{machineState.esp32Ip}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium">Protocolo de Mensagem</span>
                <p className="font-mono font-bold text-emerald-700">WebSocket / REST API</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium">Sinal Wi-Fi (RSSI)</span>
                <p className="font-mono font-bold text-slate-900">{machineState.esp32Rssi} dBm (Excelente)</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium">Autenticação Leitor RFID</span>
                <p className="font-mono font-bold text-indigo-700">RC522 SPI Active</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
