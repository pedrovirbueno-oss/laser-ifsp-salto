'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Touchpad,
  ClipboardList,
  Cpu,
  Package,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Download,
  Upload,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, company, role, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor'] },
    { name: 'Apontamento Operador', href: '/operator', icon: Touchpad, roles: ['admin', 'supervisor', 'operator'] },
    { name: 'Ordens de Produção', href: '/orders', icon: ClipboardList, roles: ['admin', 'supervisor'] },
    { name: 'Máquinas', href: '/machines', icon: Cpu, roles: ['admin', 'supervisor'] },
    { name: 'Produtos', href: '/products', icon: Package, roles: ['admin'] },
    { name: 'Motivos de Parada', href: '/reasons', icon: AlertTriangle, roles: ['admin'] },
    { name: 'Turnos', href: '/shifts', icon: Clock, roles: ['admin'] },
    { name: 'Relatórios PDF', href: '/reports', icon: FileSpreadsheet, roles: ['admin', 'supervisor'] },
    { name: 'Exportar CSV', href: '/export', icon: Download, roles: ['admin', 'supervisor'] },
    { name: 'Importar CSV/Excel', href: '/import', icon: Upload, roles: ['admin'] },
    { name: 'Central de Alertas', href: '/alerts', icon: Bell, roles: ['admin', 'supervisor'] },
    { name: 'Trilha de Auditoria', href: '/audit', icon: ShieldCheck, roles: ['admin'] },
    { name: 'Configurações', href: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex h-screen sticky top-0 text-slate-200">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xl shadow-md shadow-blue-500/20">
            N
          </div>
          <div>
            <span className="font-bold text-white tracking-wide text-base">NEXO</span>
            <span className="block text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Production</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {role === 'admin' && company && (company.setup_completed_at === null || company.setup_completed_at === undefined) && (
            <Link
              href="/setup"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-md mb-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Concluir configuração da planta industrial</span>
            </Link>
          )}
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <span className="block text-xs font-semibold text-white truncate">{user?.name || 'Usuário'}</span>
              <span className="block text-[10px] uppercase font-mono text-blue-400 tracking-wider">
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Encerrar Sessão"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
