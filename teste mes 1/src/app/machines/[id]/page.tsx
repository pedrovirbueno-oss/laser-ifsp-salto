'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { deriveMachineStatus } from '@/lib/machineStatus';
import { calculateOee } from '@/lib/oee';
import { Machine, ProductionRecord, DowntimeRecord } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Cpu, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function MachineDetailPage() {
  const params = useParams();
  const machineId = params.id as string;

  const { company } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [machine, setMachine] = useState<Machine | null>(null);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);

  useEffect(() => {
    async function loadMachineDetail() {
      try {
        const [mac, prods, downs] = await Promise.all([
          repositories.machines.getById(compId, machineId),
          repositories.production.getByMachine(compId, machineId),
          repositories.downtime.getByMachine(compId, machineId),
        ]);

        setMachine(mac);
        setProductionRecords(prods);
        setDowntimeRecords(downs);
      } catch (err) {
        console.error('Failed to load machine detail:', err);
      }
    }
    loadMachineDetail();
  }, [company, machineId]);

  if (!machine) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-slate-400">Carregando detalhes da máquina...</p>
        </div>
      </div>
    );
  }

  const activeProd = productionRecords.find((p) => !p.end_time);
  const activeDown = downtimeRecords.find((d) => !d.end_time);
  const state = deriveMachineStatus(activeProd, activeDown);

  const oee = calculateOee(productionRecords, downtimeRecords, 480 * 30);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Link href="/machines" className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                  {machine.name} <span className="font-mono text-sm text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">{machine.code}</span>
                </h1>
                <p className="text-xs text-slate-400">Setor: {machine.sector} • {machine.description || 'Sem descrição'}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-slate-900 border-slate-800">
              {state.statusBadge}
            </span>
          </div>

          {/* OEE Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">OEE da Máquina</span>
              <span className="text-3xl font-extrabold text-purple-400">{oee.oee}%</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Disponibilidade</span>
              <span className="text-3xl font-extrabold text-blue-400">{oee.availability}%</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Performance</span>
              <span className="text-3xl font-extrabold text-emerald-400">{oee.performance}%</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Qualidade</span>
              <span className="text-3xl font-extrabold text-indigo-400">{oee.quality}%</span>
            </div>
          </div>

          {/* Recent Production History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white">Histórico de Produção Apontada ({productionRecords.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Data/Início</th>
                    <th className="p-3">OP</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3">Produzido</th>
                    <th className="p-3">Refugo</th>
                    <th className="p-3">Peças Boas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {productionRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-slate-400">{new Date(r.start_time).toLocaleString('pt-BR')}</td>
                      <td className="p-3 font-mono font-bold text-blue-400">{r.order_code || 'OP-2026-0840'}</td>
                      <td className="p-3 text-white font-semibold">{r.operator_name || 'João Pedro'}</td>
                      <td className="p-3 font-bold text-white">{r.produced_quantity}</td>
                      <td className="p-3 font-bold text-red-400">{r.rejected_quantity}</td>
                      <td className="p-3 font-bold text-emerald-400">{r.good_quantity}</td>
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
