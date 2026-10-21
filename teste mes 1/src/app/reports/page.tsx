'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FilterBar from '@/components/dashboard/FilterBar';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { repositories } from '@/repositories';
import { calculateOee } from '@/lib/oee';
import { Machine, ProductionOrder, ProductionRecord, DowntimeRecord, Shift, Product, Profile } from '@/types';
import { FileSpreadsheet, Download, FileText, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { company } = useAuth();
  const { period, selectedMachineId, selectedShiftId, selectedProductId, selectedOperatorId } = useFilters();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [operators, setOperators] = useState<Profile[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [macs, sfts, prods, ops, prodsRec, downsRec] = await Promise.all([
          repositories.machines.getAll(compId),
          repositories.company.getShifts(compId),
          repositories.products.getAll(compId),
          repositories.users.getAll(compId),
          repositories.production.getAll(compId),
          repositories.downtime.getAll(compId),
        ]);
        setMachines(macs);
        setShifts(sfts);
        setProducts(prods);
        setOperators(ops);
        setProductionRecords(prodsRec);
        setDowntimeRecords(downsRec);
      } catch (err) {
        console.error('Failed to load report data:', err);
      }
    }
    loadData();
  }, [company]);

  const filteredProduction = productionRecords.filter((p) => {
    if (selectedMachineId !== 'all' && p.machine_id !== selectedMachineId) return false;
    if (selectedShiftId !== 'all' && p.shift_id !== selectedShiftId) return false;
    if (selectedProductId !== 'all' && p.product_id !== selectedProductId) return false;
    if (selectedOperatorId !== 'all' && p.operator_id !== selectedOperatorId) return false;
    return true;
  });

  const filteredDowntime = downtimeRecords.filter((d) => {
    if (selectedMachineId !== 'all' && d.machine_id !== selectedMachineId) return false;
    if (selectedOperatorId !== 'all' && d.operator_id !== selectedOperatorId) return false;
    return true;
  });

  const totalProduced = filteredProduction.reduce((acc, curr) => acc + (curr.produced_quantity || 0), 0);
  const totalRejected = filteredProduction.reduce((acc, curr) => acc + (curr.rejected_quantity || 0), 0);
  const totalGood = Math.max(0, totalProduced - totalRejected);

  const productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Product>);
  const oee = calculateOee(filteredProduction, filteredDowntime, 480 * 30, productsMap);

  const handleGeneratePdf = () => {
    const doc = new jsPDF();

    // Header Branding
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NEXO Production — Relatório Gerencial Industrial', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${company?.name || 'Metalúrgica Vale Industrial'} | Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);

    // Summary Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo de Indicadores Operacionais', 14, 42);

    const summaryData = [
      ['Produção Total (Peças)', totalProduced.toLocaleString()],
      ['Peças Rejeitadas (Refugo)', totalRejected.toLocaleString()],
      ['Peças Boas', totalGood.toLocaleString()],
      ['Disponibilidade (%)', `${oee.availability}%`],
      ['Performance (%)', `${oee.performance}%`],
      ['Qualidade (%)', `${oee.quality}%`],
      ['OEE Global (%)', oee.sufficientData ? `${oee.oee}%` : 'Dados Insuficientes'],
    ];

    autoTable(doc, {
      startY: 47,
      head: [['Indicador Operacional', 'Valor Medido']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    });

    // Production Breakdown Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text('Detalhamento de Apontamentos de Produção', 14, finalY + 15);

    const prodRows = filteredProduction.map((p) => [
      new Date(p.start_time).toLocaleDateString('pt-BR'),
      p.order_code || 'OP-2026-0840',
      p.product_name || 'Eixo Transmissão',
      p.operator_name || 'João Pedro',
      p.produced_quantity.toString(),
      p.rejected_quantity.toString(),
      (p.good_quantity ?? Math.max(0, (p.produced_quantity || 0) - (p.rejected_quantity || 0))).toString(),
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'OP', 'Produto', 'Operador', 'Total', 'Refugo', 'Boas']],
      body: prodRows.length > 0 ? prodRows : [['-', '-', 'Nenhum registro encontrado', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Documento gerado por NEXO Soluções Industriais e Automação S/A', 14, 285);

    doc.save(`Relatorio_NEXO_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Relatórios Gerenciais em PDF</h1>
              <p className="text-xs text-slate-400">Geração de relatórios executivos estruturados da operação industrial.</p>
            </div>
            <button
              onClick={handleGeneratePdf}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Download className="w-4 h-4" /> GERAR PDF ESTRUTURADO
            </button>
          </div>

          <FilterBar machines={machines} shifts={shifts} products={products} operators={operators} />

          {/* Report Document Preview Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">Pré-visualização do Relatório</span>
                <h2 className="text-xl font-bold text-white">Relatório de Produção e OEE</h2>
                <p className="text-xs text-slate-400">Empresa: {company?.name || 'Metalúrgica Vale Industrial'}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500/40" />
            </div>

            {/* Preview Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block mb-1">Produção Apontada</span>
                <span className="text-xl font-extrabold text-white">{totalProduced.toLocaleString()} pçs</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block mb-1">Refugo Total</span>
                <span className="text-xl font-extrabold text-red-400">{totalRejected.toLocaleString()} pçs</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block mb-1">Peças Conformes</span>
                <span className="text-xl font-extrabold text-emerald-400">{totalGood.toLocaleString()} pçs</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block mb-1">OEE Calculado</span>
                <span className="text-xl font-extrabold text-purple-400">{oee.sufficientData ? `${oee.oee}%` : 'Sem dados'}</span>
              </div>
            </div>

            {/* Preview Records Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">OP</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3">Produzido</th>
                    <th className="p-3">Refugo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredProduction.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-mono">{new Date(p.start_time).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-mono font-bold text-blue-400">{p.order_code || 'OP-2026-0840'}</td>
                      <td className="p-3 font-semibold text-white">{p.product_name || 'Eixo Transmissão'}</td>
                      <td className="p-3">{p.operator_name || 'João Pedro'}</td>
                      <td className="p-3 font-bold text-white">{p.produced_quantity}</td>
                      <td className="p-3 font-bold text-red-400">{p.rejected_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
