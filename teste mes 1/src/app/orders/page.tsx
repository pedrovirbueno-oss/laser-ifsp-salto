'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { ProductionOrder, Product } from '@/types';
import { ClipboardList, Plus, Search, Filter, AlertTriangle } from 'lucide-react';

export default function OrdersPage() {
  const { company, role } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newQty, setNewQty] = useState(1000);
  const [newDueDate, setNewDueDate] = useState('');

  const loadData = async () => {
    try {
      const [ords, prods] = await Promise.all([
        repositories.orders.getAll(compId),
        repositories.products.getAll(compId),
      ]);
      setOrders(ords);
      setProducts(prods);
      if (prods.length > 0 && !newProductId) setNewProductId(prods[0].id);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newProductId) return;

    try {
      const prod = products.find((p) => p.id === newProductId);
      await repositories.orders.create({
        company_id: compId,
        code: newCode,
        product_id: newProductId,
        product_name: prod?.name || '',
        planned_quantity: Number(newQty),
        produced_quantity: 0,
        rejected_quantity: 0,
        start_date: new Date().toISOString(),
        due_date: newDueDate ? new Date(newDueDate).toISOString() : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        status: 'planned',
      });

      setShowModal(false);
      setNewCode('');
      setNewQty(1000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar Ordem de Produção');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const query = search.toLowerCase();
      const matchCode = o.code.toLowerCase().includes(query);
      const matchProd = o.product_name?.toLowerCase().includes(query);
      return matchCode || matchProd;
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
              <h1 className="text-2xl font-extrabold text-white">Ordens de Produção (OP)</h1>
              <p className="text-xs text-slate-400">Gerenciamento e acompanhamento de progresso de OPs.</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Nova Ordem de Produção
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por OP ou produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-slate-400 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="planned">Planejada</option>
                <option value="active">Em Execução</option>
                <option value="paused">Pausada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-4">OP</th>
                    <th className="p-4">Produto</th>
                    <th className="p-4">Planejado</th>
                    <th className="p-4">Produzido</th>
                    <th className="p-4">Refugo</th>
                    <th className="p-4">Progresso (%)</th>
                    <th className="p-4">Prazo</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.map((o) => {
                    const pct = o.planned_quantity > 0 ? Math.min(100, Math.round((o.produced_quantity / o.planned_quantity) * 100)) : 0;
                    return (
                      <tr key={o.id} className="hover:bg-slate-800/30">
                        <td className="p-4 font-mono font-bold text-blue-400">{o.code}</td>
                        <td className="p-4 font-semibold text-white">{o.product_name}</td>
                        <td className="p-4 font-semibold text-white">{o.planned_quantity.toLocaleString()}</td>
                        <td className="p-4 font-semibold text-emerald-400">{o.produced_quantity.toLocaleString()}</td>
                        <td className="p-4 font-semibold text-red-400">{o.rejected_quantity.toLocaleString()}</td>
                        <td className="p-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-300 w-12 text-right">{o.produced_quantity} / {o.planned_quantity} ({pct}%)</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {new Date(o.due_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              o.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : o.status === 'active'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : o.status === 'paused'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateOrder} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Criar Nova Ordem de Produção</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Código da OP (ex: OP-2026-0850)</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Produto</label>
              <select
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade Planejada</label>
              <input
                type="number"
                min="1"
                required
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data Limite / Prazo</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
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
                Criar OP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
