import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, Sparkles, CheckCircle2, AlertTriangle, Info, ArrowRight } from 'lucide-react';

export const LiveToastNotifications = () => {
  const { toastNotifications, dismissToast, setActiveTab, setSelectedProjectForApproval } = useApp();

  if (!toastNotifications || toastNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toastNotifications.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border-2 shadow-2xl p-4 transition-all duration-300 animate-scale-up flex items-start gap-3 ${
            toast.type === 'NEW_STUDENT_PROJECT'
              ? 'bg-slate-900 border-emerald-400 text-white'
              : toast.type === 'SUCCESS'
              ? 'bg-emerald-900 border-emerald-400 text-white'
              : toast.type === 'WARNING'
              ? 'bg-amber-900 border-amber-400 text-white'
              : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
            {toast.type === 'NEW_STUDENT_PROJECT' ? (
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            ) : toast.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : toast.type === 'WARNING' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Bell className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                {toast.badge || 'NOTIFICAÇÃO EM TEMPO REAL'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{toast.timestamp}</span>
            </div>

            <h4 className="font-bold text-sm text-white mt-1.5 leading-snug">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {toast.message}
            </p>

            {toast.projectData && (
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-emerald-300 truncate">
                  {toast.projectData.studentName} • {toast.projectData.materialType}
                </span>
                <button
                  onClick={() => {
                    setActiveTab('workorders');
                    setSelectedProjectForApproval(toast.projectData);
                    dismissToast(toast.id);
                  }}
                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  <span>Analisar Agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
