import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Layers, Clock, Play, Power, FileText, Calendar, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export const ReportsView = () => {
  const { cycleStats, formatSecondsToHms, workOrders, machines, addAlert } = useApp();

  const todayIso = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(todayIso);

  const handleQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  // Filter Work Orders by the selected date range
  const filteredOsByDate = workOrders.filter(os => {
    const osDate = os.createdIsoDate || todayIso;
    return osDate >= startDate && osDate <= endDate;
  });

  // Weekly data
  const data = [
    { dia: 'Seg', correnteMedia: 5.1, horasCorte: 4.2, mdfM2: 2.5 },
    { dia: 'Ter', correnteMedia: 5.4, horasCorte: 5.6, mdfM2: 3.8 },
    { dia: 'Qua', correnteMedia: 4.9, horasCorte: 3.1, mdfM2: 1.9 },
    { dia: 'Qui', correnteMedia: 5.5, horasCorte: 6.8, mdfM2: 4.2 },
    { dia: 'Sex', correnteMedia: 5.2, horasCorte: 5.0, mdfM2: 3.1 },
  ];

  // Current Cycle breakdown (Tempo Ligada vs Tempo Real de Trabalho)
  const actualHoursNum = Number((cycleStats.actualCuttingTimeSeconds / 3600).toFixed(2));
  const idleHoursNum = Number((cycleStats.idleTimeSeconds / 3600).toFixed(2));

  const pieData = [
    { name: 'Trabalho Efetivo (Laser Ativo > 3.0A)', value: actualHoursNum, color: '#059669' },
    { name: 'Ocioso / Setup / Troca de Peça', value: idleHoursNum, color: '#94a3b8' }
  ];

  const totalOnFormatted = formatSecondsToHms(cycleStats.totalOnTimeSeconds);
  const actualCuttingFormatted = formatSecondsToHms(cycleStats.actualCuttingTimeSeconds);
  const idleFormatted = formatSecondsToHms(cycleStats.idleTimeSeconds);

  const workRatioPercent = cycleStats.totalOnTimeSeconds > 0
    ? ((cycleStats.actualCuttingTimeSeconds / cycleStats.totalOnTimeSeconds) * 100).toFixed(1)
    : 0;

  const formatBrDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // Generate functional PDF Report filtered by the chosen date range
  const handleGeneratePdfReport = () => {
    const nowStr = new Date().toLocaleString('pt-BR');
    const periodLabel = `${formatBrDate(startDate)} até ${formatBrDate(endDate)}`;
    const reportWindow = window.open('', '_blank', 'width=980,height=800');
    if (!reportWindow) {
      window.print();
      return;
    }

    const osRowsHtml = filteredOsByDate.map(os => `
      <tr>
        <td style="font-family: monospace; font-weight: bold;">${os.code}</td>
        <td>${os.createdAt}</td>
        <td>${os.machineId === 'LASER-02' ? '02 - MAFRAN MF-6040' : '01 - Laser Amarela'}</td>
        <td>${os.materialType}</td>
        <td>${os.quantity}</td>
        <td>${os.requester}</td>
        <td>${os.operator}</td>
        <td style="font-family: monospace; font-weight: bold; color: #047857;">${formatSecondsToHms(os.realCuttingSeconds)}</td>
        <td><strong>${os.status}</strong></td>
      </tr>
    `).join('');

    const machinesHtml = machines.map(m => `
      <div class="machine-box">
        <h4>${m.number} - ${m.name} (${m.model})</h4>
        <p><strong>Status Operacional:</strong> ${m.status} | <strong>OS Vinculada:</strong> ${m.currentOsCode}</p>
        <p><strong>Corrente Monitorada (Não-Invasiva):</strong> ${m.currentAmp} A | <strong>Progresso Sincronizado:</strong> ${m.progress.toFixed(1)}%</p>
        <p><strong>Uso do Tubo CO2:</strong> ${m.laserTubeHours}h / 2000h | <strong>Mesa Útil:</strong> ${m.bedSize}</p>
      </div>
    `).join('');

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatorio_Laser_IFSP_Salto_${startDate}_a_${endDate}.pdf</title>
        <style>
          * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, Arial, sans-serif; }
          body { margin: 0; padding: 32px; color: #0f172a; background: #fff; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
          .header-left { display: flex; align-items: center; gap: 16px; }
          .header-left img { height: 58px; }
          .title h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .title p { margin: 4px 0 0; font-size: 12px; color: #475569; }
          .badge { background: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: right; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
          .kpi-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background: #f8fafc; }
          .kpi-card span { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; }
          .kpi-card strong { font-size: 20px; color: #0f172a; font-family: monospace; margin-top: 4px; display: block; }
          h3 { font-size: 14px; text-transform: uppercase; color: #0f172a; border-left: 4px solid #059669; padding-left: 10px; margin: 24px 0 12px; }
          .machines-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px; }
          .machine-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #f8fafc; }
          .machine-box h4 { margin: 0 0 6px; font-size: 13px; color: #047857; }
          .machine-box p { margin: 4px 0; font-size: 11px; color: #334155; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background:#0f172a; color:#fff; padding:12px 20px; border-radius:10px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px;">📄 <strong>Relatório PDF Filtrado (${periodLabel}):</strong> Selecione <em>"Salvar como PDF"</em> na janela de impressão.</span>
          <button onclick="window.print()" style="background:#10b981; color:#0f172a; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer;">Salvar / Baixar PDF Agora</button>
        </div>

        <div class="header">
          <div class="header-left">
            <img src="${window.location.origin}/assets/logo-ifsp-salto.png" alt="IFSP Salto" />
            <div class="title">
              <h1>INSTITUTO FEDERAL DE SÃO PAULO - CÂMPUS SALTO</h1>
              <p>Relatório Técnico de Operação, Corrente Elétrica (A) e Ordens de Serviço - Corte a Laser CO2</p>
            </div>
          </div>
          <div class="badge">
            PERÍODO: ${periodLabel}<br/>
            <span style="font-weight:normal; font-size:10px;">Emitido em ${nowStr}</span>
          </div>
        </div>

        <h3>1. Desempenho do Ciclo de Trabalho no Período</h3>
        <div class="kpi-grid">
          <div class="kpi-card">
            <span>Tempo Total Máquina Ligada</span>
            <strong>${totalOnFormatted}</strong>
          </div>
          <div class="kpi-card">
            <span>Tempo Efetivo de Corte Laser</span>
            <strong style="color:#059669;">${actualCuttingFormatted} (${workRatioPercent}%)</strong>
          </div>
          <div class="kpi-card">
            <span>Ordens Filtradas no Período</span>
            <strong>${filteredOsByDate.length} OS(s)</strong>
          </div>
        </div>

        <h3>2. Estado Telemétrico das Bancadas (Leitura de Corrente Não-Invasiva)</h3>
        <div class="machines-grid">
          ${machinesHtml}
        </div>

        <h3>3. Ordens de Serviço no Período (${periodLabel})</h3>
        <table>
          <thead>
            <tr>
              <th>Código OS</th>
              <th>Data/Hora</th>
              <th>Máquina</th>
              <th>Material</th>
              <th>Quantidade</th>
              <th>Aluno / Solicitante</th>
              <th>Perfil Operador</th>
              <th>Tempo Real Usado</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${osRowsHtml || '<tr><td colspan="9" style="text-align:center;">Nenhuma OS registrada neste intervalo de datas.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>Instituto Federal de Educação, Ciência e Tecnologia de São Paulo • Câmpus Salto</span>
          <span>Documento gerado digitalmente pelo Sistema de Supervisão de Corte a Laser</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 350);
          };
        </script>
      </body>
      </html>
    `);
    reportWindow.document.close();
    addAlert('SUCCESS', `Relatório PDF do período ${periodLabel} exportado com sucesso.`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Title & Date Range Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              <span>RELATÓRIOS TÉCNICOS E EXPORTAÇÃO EM PDF POR PERÍODO</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Escolha a data inicial e final para filtrar os dados de máquina e exportar o laudo em PDF
            </p>
          </div>

          <button
            onClick={handleGeneratePdfReport}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF do Período ({filteredOsByDate.length} OSs)</span>
          </button>
        </div>

        {/* Date Picker Filter Controls */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Período de Exportação:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">De:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setStartDate(todayIso); setEndDate(todayIso); }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(7)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
            >
              Últimos 7 Dias
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(30)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
            >
              Últimos 30 Dias
            </button>
          </div>
        </div>
      </div>

      {/* SPECIAL CARD: TEMPO LIGADA POR CICLO vs TEMPO REALMENTE TRABALHADO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>DESEMPENHO DO CICLO (TEMPO LIGADA VS TEMPO EFETIVO DE CORTE)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ciclo iniciado às <strong className="text-slate-800 font-mono">{cycleStats.cycleStartTime}</strong> • Período selecionado: <strong className="text-emerald-700">{formatBrDate(startDate)} a {formatBrDate(endDate)}</strong>
            </p>
          </div>

          <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200 font-mono">
            {workRatioPercent}% de Eficiência Ativa no Ciclo
          </span>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Tempo Total Ligada (Ciclo)</span>
              <Power className="w-4 h-4 text-slate-600" />
            </div>
            <p className="font-mono text-xl font-extrabold text-slate-900">{totalOnFormatted}</p>
            <p className="text-[10px] text-slate-400">Corrente &gt; 1.0 A detectada na entrada</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
            <div className="flex justify-between items-center text-xs text-emerald-800">
              <span className="font-semibold uppercase tracking-wider">Tempo Realmente Trabalhado</span>
              <Play className="w-4 h-4 text-emerald-600 fill-current" />
            </div>
            <p className="font-mono text-xl font-extrabold text-emerald-900">{actualCuttingFormatted}</p>
            <p className="text-[10px] text-emerald-700 font-medium">Laser CO2 cortando (Corrente &gt; 3.0 A)</p>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wider">Tempo Ocioso / Setup</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <p className="font-mono text-xl font-extrabold text-slate-800">{idleFormatted}</p>
            <p className="text-[10px] text-slate-500">Posicionamento de chapa / Standby</p>
          </div>

        </div>

        {/* Graphical Pie Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          
          <div className="md:col-span-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-7 space-y-3">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
              Distribuição Relativa do Ciclo
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span className="font-semibold text-slate-800">Trabalho Efetivo (Laser Emitindo)</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">{actualHoursNum}h ({workRatioPercent}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span className="font-semibold text-slate-800">Ocioso / Setup / Alimentação</span>
                </div>
                <span className="font-mono font-bold text-slate-700">{idleHoursNum}h ({(100 - workRatioPercent).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* WEEKLY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>HORAS DE USINAGEM LASER POR DIA (h)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff' }} />
                <Bar dataKey="horasCorte" fill="#059669" radius={[6, 6, 0, 0]} name="Horas de Corte (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>ÁREA DE MATERIAL PROCESSADO (m²)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff' }} />
                <Bar dataKey="mdfM2" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Material (m²)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
