'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { DowntimeReason, DowntimeCategory } from '@/types';
import { AlertTriangle, Plus } from 'lucide-react';

export default function ReasonsPage() {
  const { company, role } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [reasons, setReasons] = useState<DowntimeReason[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<DowntimeCategory>('setup');

  const loadData = async () => {
    try {
      const reas = await repositories.downtime.getReasons(compId);
      setReasons(reas);
    } catch (err) {
      console.error('Failed to load downtime reasons:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleCreateReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      await repositories.downtime.createReason({
        company_id: compId,
        name: newName,
        category: newCat,
        active: true,
      });

      setShowModal(false);
      setNewName('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar motivo');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await repositories.downtime.toggleReasonActive(compId, id, !currentActive);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do motivo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Motivos de Parada</h1>
              <p className="text-xs text-slate-400">Classificação e cadastro de justificativas de downtime industrial.</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Cadastrar Motivo de Parada
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Motivo da Parada</th>
                    <th className="p-4">Categoria Industrial</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reasons.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-white">{r.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-950 text-blue-400 border border-slate-800">
                          {r.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {r.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {role === 'admin' && (
                          <button
                            onClick={() => handleToggleActive(r.id, r.active)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            {r.active ? 'Desativar' : 'Ativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateReason} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Cadastrar Motivo de Parada</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Motivo</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                placeholder="ex: Falha na Bomba Hidráulica"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria Industrial</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as DowntimeCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white uppercase font-mono"
              >
                <option value="setup">SETUP</option>
                <option value="maintenance">MANUTENÇÃO</option>
                <option value="material">FALTA DE MATERIAL</option>
                <option value="quality">QUALIDADE</option>
                <option value="operator">OPERADOR</option>
                <option value="adjustment">AJUSTE</option>
                <option value="electrical">ELÉTRICA</option>
                <option value="mechanical">MECÂNICA</option>
                <option value="other">OUTROS</option>
              </select>
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
