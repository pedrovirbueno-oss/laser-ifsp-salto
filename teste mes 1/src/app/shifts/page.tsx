'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { Shift } from '@/types';
import { Clock, Plus } from 'lucide-react';

export default function ShiftsPage() {
  const { company, role } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('06:00');
  const [newEnd, setNewEnd] = useState('14:00');

  const loadData = async () => {
    try {
      const sfts = await repositories.company.getShifts(compId);
      setShifts(sfts);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      await repositories.company.createShift({
        company_id: compId,
        name: newName,
        start_time: newStart,
        end_time: newEnd,
        active: true,
      });

      setShowModal(false);
      setNewName('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar turno');
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
              <h1 className="text-2xl font-extrabold text-white">Turnos de Trabalho</h1>
              <p className="text-xs text-slate-400">Jornadas operacionais e horários da fábrica (suporta turnos noturnos que atravessam a meia-noite).</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Cadastrar Turno
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((s) => {
              const isOvernight = s.start_time > s.end_time;
              return (
                <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-base">{s.name}</span>
                    {isOvernight && (
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        Atravessa Meia-Noite
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Início</span>
                      <span className="font-mono font-bold text-blue-400 text-sm">{s.start_time}</span>
                    </div>
                    <span>→</span>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Término</span>
                      <span className="font-mono font-bold text-blue-400 text-sm">{s.end_time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateShift} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Cadastrar Turno de Trabalho</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Turno (ex: Turno C - Noturno)</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Horário de Início</label>
                <input
                  type="time"
                  required
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Horário de Fim</label>
                <input
                  type="time"
                  required
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
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
