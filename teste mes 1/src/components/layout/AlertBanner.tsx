'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Machine, DowntimeRecord, ProductionOrder } from '@/types';

interface AlertBannerProps {
  stoppedMachines: Array<{ machine: Machine; downtime?: DowntimeRecord }>;
  criticalScrapOrders: ProductionOrder[];
  nearDeadlineOrders: ProductionOrder[];
}

export default function AlertBanner({ stoppedMachines, criticalScrapOrders, nearDeadlineOrders }: AlertBannerProps) {
  const hasAlerts = stoppedMachines.length > 0 || criticalScrapOrders.length > 0 || nearDeadlineOrders.length > 0;

  if (!hasAlerts) return null;

  return (
    <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 mb-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>ÁREA DE ATENÇÃO OPERACIONAL — ALERTAS ATIVOS</span>
        </div>
        <span className="text-xs text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
          {stoppedMachines.length + criticalScrapOrders.length + nearDeadlineOrders.length} alerta(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Stopped Machines Warnings */}
        {stoppedMachines.map(({ machine, downtime }) => {
          const durationMins = downtime?.start_time
            ? Math.floor((Date.now() - new Date(downtime.start_time).getTime()) / (1000 * 60))
            : 0;
          return (
            <Link
              key={machine.id}
              href={`/machines/${machine.id}`}
              className="p-3 bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 rounded-lg flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">{machine.name} ({machine.code})</span>
                  <span className="text-[11px] text-amber-300">
                    Parada há {durationMins > 0 ? `${durationMins} min` : 'pouco tempo'} ({downtime?.reason_name || 'Parada sem motivo'})
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          );
        })}

        {/* High Scrap Warnings */}
        {criticalScrapOrders.map((order) => {
          const scrapPct = order.produced_quantity > 0 ? ((order.rejected_quantity / order.produced_quantity) * 100).toFixed(1) : '0';
          return (
            <Link
              key={order.id}
              href="/orders"
              className="p-3 bg-slate-950/80 border border-red-500/40 hover:border-red-400 rounded-lg flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Refugo crítico em {order.code}</span>
                  <span className="text-[11px] text-red-300">Refugo acumulado: {scrapPct}% (Meta: max 2.0%)</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          );
        })}

        {/* Deadline Warnings */}
        {nearDeadlineOrders.map((order) => (
          <Link
            key={order.id}
            href="/orders"
            className="p-3 bg-slate-950/80 border border-blue-500/40 hover:border-blue-400 rounded-lg flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Prazo próximo: {order.code}</span>
                <span className="text-[11px] text-blue-300">Progresso: {order.produced_quantity}/{order.planned_quantity} pçs</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
