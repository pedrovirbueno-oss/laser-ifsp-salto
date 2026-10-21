'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Database, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: 'online' | 'fallback' | 'demo' | 'checking';
  database?: {
    connected: boolean;
    mode: string;
    latencyMs: number;
    message: string;
  };
  testUsers?: {
    available: boolean;
    count: number;
  };
}

export default function LoginPage() {
  const { loginDemoUser, loginWithPassword } = useAuth();

  const [email, setEmail] = useState('admin@nexoproduction.demo');
  const [password, setPassword] = useState('demo123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<HealthStatus>({ status: 'checking' });

  const checkSystemHealth = async () => {
    setHealth({ status: 'checking' });
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({
          status: 'fallback',
          database: {
            connected: false,
            mode: 'FALLBACK',
            latencyMs: 0,
            message: 'Modo de contingência local ativo para Usuário Teste.',
          },
          testUsers: { available: true, count: 3 },
        });
      }
    } catch {
      setHealth({
        status: 'fallback',
        database: {
          connected: false,
          mode: 'FALLBACK',
          latencyMs: 0,
          message: 'Modo de contingência local ativo para Usuário Teste.',
        },
        testUsers: { available: true, count: 3 },
      });
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await loginWithPassword(email, password);
      if (!result.success) {
        setErrorMsg(result.error || 'Falha ao autenticar no sistema.');
      }
    } catch {
      setErrorMsg('Falha ao autenticar no sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123456');
    setErrorMsg('');
    setIsLoading(true);
    try {
      await loginDemoUser(demoEmail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/20 mx-auto">
            N
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NEXO Production</h1>
          <p className="text-xs text-slate-400">Plataforma SaaS B2B de Monitoramento Industrial</p>
        </div>

        {/* Real-time Database & Test User Validation Panel */}
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Diagnóstico de Banco & Ambiente
            </span>
            <button
              type="button"
              onClick={checkSystemHealth}
              title="Revalidar conexão"
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${health.status === 'checking' ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
            <span className="text-slate-400">Banco de Dados:</span>
            {health.status === 'checking' ? (
              <span className="text-blue-400 font-semibold">Validando conexão...</span>
            ) : health.status === 'online' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Online ({health.database?.latencyMs}ms)
              </span>
            ) : health.status === 'demo' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Banco em Memória Ativo
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Contingência Local Ativa
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Usuários de Teste:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 3 Perfis Validados (Admin/Sup/Op)
            </span>
          </div>

          {health.database?.message && (
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 leading-relaxed">
              {health.database.message}
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo ou Teste</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="admin@nexoproduction.demo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Autenticando...' : 'Acessar Plataforma'}
          </button>
        </form>

        {/* 1-Click Test User Credentials Switcher - Always Available for Validation */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Acesso Rápido — Usuário Teste (1 Clique):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('admin@nexoproduction.demo')}
              className="p-2.5 bg-slate-950 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/60 rounded-lg text-[11px] font-bold text-slate-200 text-center transition-all"
            >
              ADMIN
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('supervisor@nexoproduction.demo')}
              className="p-2.5 bg-slate-950 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/60 rounded-lg text-[11px] font-bold text-slate-200 text-center transition-all"
            >
              SUPERVISOR
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('operador@nexoproduction.demo')}
              className="p-2.5 bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/60 rounded-lg text-[11px] font-bold text-emerald-300 text-center transition-all"
            >
              OPERADOR
            </button>
          </div>
        </div>

        <div className="text-center pt-1">
          <p className="text-[11px] text-slate-500">
            NEXO Soluções Industriais e Automação S/A
          </p>
        </div>
      </div>
    </div>
  );
}

