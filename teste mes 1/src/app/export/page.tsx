'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FilterBar from '@/components/dashboard/FilterBar';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { repositories } from '@/repositories';
import { Machine, Shift, Product, Profile } from '@/types';
import { Download, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

export default function ExportPage() {
  const { company } = useAuth();
  const { period, selectedMachineId, selectedShiftId, selectedProductId, selectedOperatorId } = useFilters();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [operators, setOperators] = useState<Profile[]>([]);

  useEffect(() => {
    async function loadFilters() {
      const [macs, sfts, prods, ops] = await Promise.all([
        repositories.machines.getAll(compId),
        repositories.company.getShifts(compId),
        repositories.products.getAll(compId),
        repositories.users.getAll(compId),
      ]);
      setMachines(macs);
      setShifts(sfts);
      setProducts(prods);
      setOperators(ops);
    }
    loadFilters();
  }, [company]);

  const downloadCsv = (filename: string, data: any[]) => {
    const csv = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProduction = async () => {
    const records = await repositories.production.getAll(compId);
    const exportData = records.map((r) => ({
      ID: r.id,
      Data_Inicio: r.start_time,
      Data_Fim: r.end_time || '',
      Maquina: r.machine_name || r.machine_id,
      OP: r.order_code || r.order_id,
      Produto: r.product_name || r.product_id,
      Operador: r.operator_name || r.operator_id,
      Produzido_Total: r.produced_quantity,
      Refugo: r.rejected_quantity,
      Pecas_Boas: r.good_quantity,
    }));
    downloadCsv(`NEXO_Producao_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  const handleExportDowntime = async () => {
    const records = await repositories.downtime.getAll(compId);
    const exportData = records.map((d) => ({
      ID: d.id,
      Data_Inicio: d.start_time,
      Data_Fim: d.end_time || '',
      Maquina: d.machine_name || d.machine_id,
      Motivo: d.reason_name || d.reason_id,
      Categoria: d.category || '',
      Duracao_Segundos: d.duration_seconds,
      Observacoes: d.notes || '',
    }));
    downloadCsv(`NEXO_Paradas_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  const handleExportOrders = async () => {
    const records = await repositories.orders.getAll(compId);
    const exportData = records.map((o) => ({
      OP: o.code,
      Produto: o.product_name || o.product_id,
      Quantidade_Planejada: o.planned_quantity,
      Quantidade_Produzida: o.produced_quantity,
      Refugo: o.rejected_quantity,
      Prazo: o.due_date,
      Status: o.status,
    }));
    downloadCsv(`NEXO_Ordens_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-extrabold text-white">Exportação de Dados (CSV)</h1>
            <p className="text-xs text-slate-400">Exporte históricos completos de produção, paradas, ordens e máquinas respeitando os filtros selecionados.</p>
          </div>

          <FilterBar machines={machines} shifts={shifts} products={products} operators={operators} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="w-12 h-12 bg-blue-950 border border-blue-800 rounded-xl flex items-center justify-center text-blue-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Registros de Produção</h3>
                <p className="text-xs text-slate-400">Apontamentos de peças boas, refugo, horários e operadores.</p>
              </div>
              <button
                onClick={handleExportProduction}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" /> Exportar Produção (CSV)
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="w-12 h-12 bg-amber-950 border border-amber-800 rounded-xl flex items-center justify-center text-amber-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Registros de Paradas</h3>
                <p className="text-xs text-slate-400">Histórico de downtime, duração em segundos e motivos por categoria.</p>
              </div>
              <button
                onClick={handleExportDowntime}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Download className="w-4 h-4" /> Exportar Paradas (CSV)
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-xl flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Ordens de Produção</h3>
                <p className="text-xs text-slate-400">Status de OPs, progresso, quantidades planejadas e prazos.</p>
              </div>
              <button
                onClick={handleExportOrders}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" /> Exportar Ordens (CSV)
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
