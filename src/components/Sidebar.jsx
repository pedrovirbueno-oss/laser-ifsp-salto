import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Printer, 
  FileText, 
  CalendarDays, 
  Wrench, 
  Bell, 
  BarChart3, 
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, alerts, currentUser, logout, studentProjects } = useApp();

  const unresolvedAlertsCount = alerts.filter(a => !a.resolved).length;
  const pendingProjectsCount = studentProjects.filter(p => p.status === 'PENDENTE_ANALISE').length;

  const navItems = [
    { id: 'dashboard', label: 'VISÃO GERAL', icon: LayoutDashboard },
    { id: 'machines', label: 'MÁQUINAS LASER', icon: Printer, badge: '2 Bancadas' },
    { id: 'workorders', label: 'ORDENS DE SERVIÇO', icon: FileText, alertBadge: pendingProjectsCount },
    { id: 'production', label: 'PLANO DE PRODUÇÃO', icon: CalendarDays },
    { id: 'maintenance', label: 'MANUTENÇÃO', icon: Wrench },
    { id: 'alerts', label: 'NOTIFICAÇÕES', icon: Bell, alertBadge: unresolvedAlertsCount },
    { id: 'reports', label: 'RELATÓRIOS (PDF)', icon: BarChart3 },
    { id: 'settings', label: 'CONFIGURAÇÕES', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between min-h-[calc(100vh-73px)] print:hidden">
      
      {/* Navigation Menu */}
      <div className="p-4 space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Supervisão do Laboratório
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="tracking-wide">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}

              {item.alertBadge > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {item.alertBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Logged in User Profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
        {currentUser && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="font-bold text-xs text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-400 font-medium">
          IFSP Câmpus Salto • Monitoramento Oficial
        </div>
      </div>

    </aside>
  );
};
