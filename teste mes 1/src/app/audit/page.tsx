'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { AuditLog } from '@/types';
import { ShieldCheck, Lock, Search } from 'lucide-react';

export default function AuditPage() {
  const { company } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const auditData = await repositories.audit.getAll(compId);
        setLogs(auditData);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    }
    loadAuditLogs();
  }, [company]);

  const filteredLogs = logs.filter((l) => {
    if (search) {
      const query = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(query) ||
        (l.user_name && l.user_name.toLowerCase().includes(query)) ||
        l.entity_type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                Trilha de Auditoria <Lock className="w-4 h-4 text-emerald-400" />
              </h1>
              <p className="text-xs text-slate-400">Histórico de ações no sistema (Append-Only — Não modificável).</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
              Imutável & Protegido
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por ação, usuário ou entidade..."
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
                    <th className="p-4">Data / Hora</th>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Ação (Audit Action)</th>
                    <th className="p-4">Entidade</th>
                    <th className="p-4">ID do Registro</th>
                    <th className="p-4">Dados Gravados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/30">
                      <td className="p-4 text-slate-400">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                      <td className="p-4 font-bold text-white font-sans">{l.user_name || l.user_id}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-950 text-blue-300 border border-blue-800/60">
                          {l.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{l.entity_type}</td>
                      <td className="p-4 text-slate-500">{l.entity_id}</td>
                      <td className="p-4 text-[10px] text-slate-400 truncate max-w-xs">
                        {l.new_data ? JSON.stringify(l.new_data) : '-'}
                      </td>
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
