'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { Product } from '@/types';
import { Package, Plus, Search } from 'lucide-react';

export default function ProductsPage() {
  const { company, role } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCycle, setNewCycle] = useState(60);
  const [newHr, setNewHr] = useState(60);
  const [newScrap, setNewScrap] = useState(2.0);

  const loadData = async () => {
    try {
      const prods = await repositories.products.getAll(compId);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;

    try {
      await repositories.products.create({
        company_id: compId,
        name: newName,
        code: newCode,
        description: newDesc,
        target_cycle_time_seconds: Number(newCycle),
        target_quantity_per_hour: Number(newHr),
        target_scrap_percentage: Number(newScrap),
        active: true,
      });

      setShowModal(false);
      setNewName('');
      setNewCode('');
      setNewDesc('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar produto');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (search) {
      const query = search.toLowerCase();
      return p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
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
              <h1 className="text-2xl font-extrabold text-white">Catálogo de Produtos</h1>
              <p className="text-xs text-slate-400">Cadastro de produtos fabricados e suas metas técnicas operacionais.</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Cadastrar Produto
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Nome do Produto</th>
                    <th className="p-4">Ciclo Padrão (s)</th>
                    <th className="p-4">Meta Esperada (pçs/h)</th>
                    <th className="p-4">Meta de Refugo Max (%)</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-blue-400">{p.code}</td>
                      <td className="p-4 font-semibold text-white">{p.name}</td>
                      <td className="p-4 font-mono text-slate-300">{p.target_cycle_time_seconds}s</td>
                      <td className="p-4 font-mono font-semibold text-emerald-400">{p.target_quantity_per_hour} pçs/h</td>
                      <td className="p-4 font-mono font-semibold text-red-400">{p.target_scrap_percentage}%</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Ativo
                        </span>
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
          <form onSubmit={handleCreateProduct} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Cadastrar Novo Produto</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Produto</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Código (ex: PROD-106)</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Ciclo Padrão (s)</label>
                <input
                  type="number"
                  value={newCycle}
                  onChange={(e) => setNewCycle(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Meta/Hora</label>
                <input
                  type="number"
                  value={newHr}
                  onChange={(e) => setNewHr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Meta Refugo %</label>
                <input
                  type="number"
                  step="0.1"
                  value={newScrap}
                  onChange={(e) => setNewScrap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
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
