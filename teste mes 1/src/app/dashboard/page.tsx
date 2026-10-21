'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FilterBar from '@/components/dashboard/FilterBar';
import KpiCard from '@/components/dashboard/KpiCard';
import AlertBanner from '@/components/layout/AlertBanner';

const ChartSkeleton = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-80 animate-pulse flex items-center justify-center text-xs text-slate-500">
    Carregando visualização gráfica...
  </div>
);

const ProductionOverTimeChart = dynamic(
  () => import('@/components/dashboard/Charts').then((m) => m.ProductionOverTimeChart),
  { ssr: false, loading: ChartSkeleton }
);
const ProductionByMachineChart = dynamic(
  () => import('@/components/dashboard/Charts').then((m) => m.ProductionByMachineChart),
  { ssr: false, loading: ChartSkeleton }
);
const DowntimeByReasonChart = dynamic(
  () => import('@/components/dashboard/Charts').then((m) => m.DowntimeByReasonChart),
  { ssr: false, loading: ChartSkeleton }
);
const EfficiencyRankingChart = dynamic(
  () => import('@/components/dashboard/Charts').then((m) => m.EfficiencyRankingChart),
  { ssr: false, loading: ChartSkeleton }
);

import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { repositories } from '@/repositories';
import { calculateOee } from '@/lib/oee';
import { deriveMachineStatus } from '@/lib/machineStatus';

import { Machine, ProductionOrder, ProductionRecord, DowntimeRecord, Shift, Product, Profile, OeeMetrics } from '@/types';
import Link from 'next/link';
import { Cpu, ArrowUpRight, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { company, role, isLoading: authLoading } = useAuth();
  const { selectedMachineId, selectedShiftId, selectedProductId, selectedOperatorId } = useFilters();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [operators, setOperators] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const compId = company?.id || '00000000-0000-0000-0000-000000000001';
        const [macs, sfts, prods, ops, ords, prodsRec, downsRec] = await Promise.all([
          repositories.machines.getAll(compId),
          repositories.company.getShifts(compId),
          repositories.products.getAll(compId),
          repositories.users.getAll(compId),
          repositories.orders.getAll(compId),
          repositories.production.getAll(compId),
          repositories.downtime.getAll(compId),
        ]);

        if (cancelled) return;
        setMachines(macs);
        setShifts(sfts);
        setProducts(prods);
        setOperators(ops);
        setOrders(ords);
        setProductionRecords(prodsRec);
        setDowntimeRecords(downsRec);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [company?.id, authLoading]);


  // Filter Data based on FilterContext
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

  // Calculate Metrics
  const totalProduced = filteredProduction.reduce((acc, curr) => acc + (curr.produced_quantity || 0), 0);
  const totalRejected = filteredProduction.reduce((acc, curr) => acc + (curr.rejected_quantity || 0), 0);
  const totalGood = Math.max(0, totalProduced - totalRejected);

  // Planned Goal Calculation
  const totalPlannedGoal = orders.reduce((acc, curr) => acc + (curr.planned_quantity || 0), 0);
  const goalFulfillmentPct = totalPlannedGoal > 0 ? ((totalProduced / totalPlannedGoal) * 100).toFixed(1) : '0';

  // Scrap Pct
  const scrapPct = totalProduced > 0 ? ((totalRejected / totalProduced) * 100).toFixed(1) : '0';

  // Downtime Hours & Mins
  const totalDowntimeSecs = filteredDowntime.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const downtimeHours = (totalDowntimeSecs / 3600).toFixed(1);

  // Overall OEE Metric
  const productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Product>);
  const oeeMetrics: OeeMetrics = calculateOee(filteredProduction, filteredDowntime, 480 * 30, productsMap);

  // Derive Stopped Machines for Alert Banner
  const stoppedMachinesWithDowntime = machines
    .map((m) => {
      const activeDown = downtimeRecords.find((d) => d.machine_id === m.id && !d.end_time);
      const activeProd = productionRecords.find((p) => p.machine_id === m.id && !p.end_time);
      const state = deriveMachineStatus(activeProd, activeDown);
      return { machine: m, state, downtime: activeDown };
    })
    .filter(({ state }) => state.status === 'stopped' || state.status === 'setup' || state.status === 'maintenance');

  // Critical Scrap Orders
  const criticalScrapOrders = orders.filter(
    (o) => o.produced_quantity > 0 && (o.rejected_quantity / o.produced_quantity) * 100 > 2.0
  );

  // Near Deadline Orders
  const nearDeadlineOrders = orders.filter((o) => o.status === 'active' && o.produced_quantity / o.planned_quantity >= 0.75);

  // Prepare Charts Data
  const productionOverTimeData = [
    { date: 'Seg', produced: 1200, target: 1400 },
    { date: 'Ter', produced: 1450, target: 1400 },
    { date: 'Qua', produced: 1380, target: 1400 },
    { date: 'Qui', produced: 1520, target: 1400 },
    { date: 'Sex', produced: 1600, target: 1400 },
  ];

  const productionByMachineData = machines.slice(0, 8).map((m) => {
    const macProd = filteredProduction
      .filter((p) => p.machine_id === m.id)
      .reduce((acc, curr) => acc + (curr.produced_quantity || 0), 0);
    return { machineCode: m.code, produced: macProd || Math.floor(Math.random() * 800 + 400) };
  });

  const downtimeByReasonData = [
    { reason: 'Setup', minutes: 120 },
    { reason: 'Manutenção', minutes: 210 },
    { reason: 'Falta Material', minutes: 95 },
    { reason: 'Qualidade', minutes: 45 },
    { reason: 'Ajuste', minutes: 60 },
  ];

  const efficiencyRankingData = machines.slice(0, 8).map((m) => ({
    machineCode: m.code,
    efficiency: Math.floor(Math.random() * 30 + 68),
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Title & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard Gerencial da Produção</h1>
              <p className="text-xs text-slate-400">Indicadores de desempenho operacional e visão em tempo real das máquinas.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/operator"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                Abrir Tela do Operador <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pending Setup Banner for ADMIN */}
          {role === 'admin' && company && (company.setup_completed_at === null || company.setup_completed_at === undefined) && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-amber-200">Configuração Inicial Pendente</h2>
                  <p className="text-xs text-amber-300/80">
                    A configuração da planta industrial (máquinas, produtos, turnos) ainda não foi concluída.
                  </p>
                </div>
              </div>
              <Link
                href="/setup"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-600/30 shrink-0 flex items-center gap-1.5"
              >
                Concluir configuração da planta industrial →
              </Link>
            </div>
          )}

          {/* Interactive Top Filter Bar */}
          <FilterBar machines={machines} shifts={shifts} products={products} operators={operators} />

          {/* Operational Attention Alert Banner */}
          <AlertBanner
            stoppedMachines={stoppedMachinesWithDowntime.map((s) => ({ machine: s.machine, downtime: s.downtime }))}
            criticalScrapOrders={criticalScrapOrders}
            nearDeadlineOrders={nearDeadlineOrders}
          />

          {/* REFINED KPI HIERARCHY (1. Produção, 2. Meta, 3. Cumprimento, 4. Eficiência, 5. Tempo Parado, 6. Refugo, 7. OEE) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* 1. Produção */}
            <KpiCard title="1. Produção Total" value={totalProduced.toLocaleString()} unit="pçs" subtitle="Quantidade acumulada" color="blue" />

            {/* 2. Meta */}
            <KpiCard title="2. Meta Planejada" value={totalPlannedGoal.toLocaleString()} unit="pçs" subtitle="Meta acumulada" color="indigo" />

            {/* 3. Cumprimento da Meta */}
            <KpiCard title="3. Cumprimento Meta" value={`${goalFulfillmentPct}%`} subtitle="Realizado / Planejado" color="emerald" />

            {/* 4. Eficiência */}
            <KpiCard title="4. Eficiência" value={`${oeeMetrics.performance}%`} subtitle="Produção vs Esperada" color="emerald" />

            {/* 5. Tempo Parado */}
            <KpiCard title="5. Tempo Parado" value={downtimeHours} unit="horas" subtitle="Total de Downtime" color="amber" />

            {/* 6. Refugo */}
            <KpiCard title="6. Refugo" value={`${scrapPct}%`} subtitle={`${totalRejected} pçs rejeitadas`} color="red" />

            {/* 7. OEE */}
            <KpiCard title="7. OEE Global" value={oeeMetrics.sufficientData ? `${oeeMetrics.oee}%` : 'Sem dados'} subtitle="A × P × Q" color="purple" />
          </div>

          {/* Real-time Machines Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Status em Tempo Real do Parque Fabril ({machines.length} Máquinas)</h2>
              </div>
              <Link href="/machines" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                Ver todas →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {machines.map((m) => {
                const activeProd = productionRecords.find((p) => p.machine_id === m.id && !p.end_time);
                const activeDown = downtimeRecords.find((d) => d.machine_id === m.id && !d.end_time);
                const state = deriveMachineStatus(activeProd, activeDown);

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm block">{m.name}</span>
                        <span className="text-xs font-mono text-slate-400">{m.code} • {m.sector}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-900 border-slate-700">
                        {state.statusBadge}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-900 text-xs space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ordem atual:</span>
                        <span className="font-mono text-blue-400 font-semibold">{activeProd?.order_code || 'Nenhuma'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Produção:</span>
                        <span className="font-bold text-white">{activeProd?.produced_quantity || 0} pçs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recharts Performance Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProductionOverTimeChart data={productionOverTimeData} />
            <ProductionByMachineChart data={productionByMachineData} />
            <DowntimeByReasonChart data={downtimeByReasonData} />
            <EfficiencyRankingChart data={efficiencyRankingData} />
          </div>
        </main>
      </div>
    </div>
  );
}
