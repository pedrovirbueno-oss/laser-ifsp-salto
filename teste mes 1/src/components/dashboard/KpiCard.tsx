import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'purple';
}

export default function KpiCard({ title, value, unit, subtitle, color = 'blue' }: KpiCardProps) {
  const colorMap = {
    blue: 'border-blue-500/30 text-blue-400 bg-blue-950/20',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
    red: 'border-red-500/30 text-red-400 bg-red-950/20',
    indigo: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20',
    purple: 'border-purple-500/30 text-purple-400 bg-purple-950/20',
  };

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 shadow-lg flex flex-col justify-between ${colorMap[color]}`}>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
        {title}
      </span>
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>
      {subtitle && <span className="text-[10px] text-slate-400 font-medium">{subtitle}</span>}
    </div>
  );
}
