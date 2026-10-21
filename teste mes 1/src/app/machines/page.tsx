'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { deriveMachineStatus } from '@/lib/machineStatus';
import { Machine, ProductionRecord, DowntimeRecord } from '@/types';
import Link from 'next/link';
import { Cpu, Plus, Search, Eye } from 'lucide-react';

export default function MachinesPage() {
  const { company, role } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [machines, setMachines] = useState<Machine[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadData = async () => {
    try {
      const [macs, prods, downs] = await Promise.all([
        repositories.machines.getAll(compId),
        repositories.production.getAll(compId),
        repositories.downtime.getAll(compId),
      ]);
      setMachines(macs);
      setProductionRecords(prods);
      setDowntimeRecords(downs);
    } catch (err) {
      console.error('Failed to load machines:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;

    try {
      await repositories.machines.create({
        company_id: compId,
        name: newName,
        code: newCode,
        sector: newSector || 'Geral',
        description: newDesc,
        status: 'inactive',
        active: true,
      });

      setShowModal(false);
      setNewName('');
      setNewCode('');
      setNewSector('');
      setNewDesc('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar máquina');
    }
  };

  const filteredMachines = machines.filter((m) => {
    if (search) {
      const query = search.toLowerCase();
      return m.name.toLowerCase().includes(query) || m.code.toLowerCase().includes(query) || m.sector.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Parque de Máquinas</h1>
              <p className="text-xs text-slate-400">Cadastro, status em tempo real e detalhamento por equipamento.</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Máquina
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou setor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMachines.map((m) => {
              const activeProd = productionRecords.find((p) => p.machine_id === m.id && !p.end_time);
              const activeDown = downtimeRecords.find((d) => d.machine_id === m.id && !d.end_time);
              const state = deriveMachineStatus(activeProd, activeDown);

              return (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-blue-400 font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                        {m.code}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-slate-950 border-slate-800">
                        {state.statusBadge}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mb-1">{m.name}</h3>
                    <p className="text-xs text-slate-400 mb-4">Setor: {m.sector}</p>
                  </div>

                  <Link
                    href={`/machines/${m.id}`}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detalhes & Histórico
                  </Link>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateMachine} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Cadastrar Nova Máquina</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Equipamento</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                placeholder="ex: Torno CNC Mazak"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Código Único (ex: CNC-04)</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                placeholder="CNC-04"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Setor Industrial</label>
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                placeholder="Usinagem / Estamparia"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm"
              >
                Cadastrar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
