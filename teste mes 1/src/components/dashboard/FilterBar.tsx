'use client';

import React from 'react';
import { useFilters, PeriodOption } from '@/context/FilterContext';
import { Machine, Shift, Product, Profile } from '@/types';
import { Filter, Calendar } from 'lucide-react';

interface FilterBarProps {
  machines: Machine[];
  shifts: Shift[];
  products: Product[];
  operators: Profile[];
}

export default function FilterBar({ machines, shifts, products, operators }: FilterBarProps) {
  const {
    period,
    setPeriod,
    selectedMachineId,
    setSelectedMachineId,
    selectedShiftId,
    setSelectedShiftId,
    selectedProductId,
    setSelectedProductId,
    selectedOperatorId,
    setSelectedOperatorId,
  } = useFilters();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
        <Filter className="w-4 h-4" /> Filtros Operacionais:
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full lg:w-auto text-xs">
        {/* Period */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Período</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="60days">Últimos 60 dias</option>
          </select>
        </div>

        {/* Machine */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Máquina</label>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium truncate"
          >
            <option value="all">Todas as Máquinas</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Shift */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Turno</label>
          <select
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">Todos os Turnos</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.start_time}-{s.end_time})
              </option>
            ))}
          </select>
        </div>

        {/* Product */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Produto</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium truncate"
          >
            <option value="all">Todos os Produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Operator */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Operador</label>
          <select
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium truncate"
          >
            <option value="all">Todos os Operadores</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
