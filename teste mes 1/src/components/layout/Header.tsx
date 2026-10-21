'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Building2, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { company, role, isDemoMode, isTestSession, switchDemoRole } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 text-slate-100">
      {/* Left Company Badge */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg hidden sm:flex items-center justify-center text-blue-400">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Empresa Conectada</span>
          <span className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-none block">
            {company?.name || 'Metalúrgica Vale Industrial'}
          </span>
        </div>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* TEST / DEMO ROLE SWITCHER */}
        {(isDemoMode || isTestSession) && (
          <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-lg text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 hidden sm:inline" />
            <span className="text-blue-300 font-semibold hidden md:inline">Perfil Teste:</span>
            <select
              value={role}
              onChange={(e) => switchDemoRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-blue-700/60 text-white font-bold rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
            >
              <option value="admin">ADMIN</option>
              <option value="supervisor">SUPERVISOR</option>
              <option value="operator">OPERADOR</option>
            </select>
          </div>
        )}

        {/* Notification Icon */}
        <Link
          href="/alerts"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
          title="Central de Alertas"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
        </Link>
      </div>
    </header>
  );
}

