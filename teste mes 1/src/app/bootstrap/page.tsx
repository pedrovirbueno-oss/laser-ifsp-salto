'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react';

export default function BootstrapPage() {
  const [isCheckingLock, setIsCheckingLock] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [document, setDocument] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Summary result after success
  const [createdSummary, setCreatedSummary] = useState<{ companyName: string; adminEmail: string } | null>(null);

  useEffect(() => {
    async function checkBootstrapStatus() {
      try {
        const res = await fetch('/api/auth/bootstrap', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data.isLocked) {
            setIsLocked(true);
          }
        }
      } catch (err) {
        // Soft catch, fallback to form
      } finally {
        setIsCheckingLock(false);
      }
    }
    checkBootstrapStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend Validations
    if (!companyName.trim()) {
      setErrorMsg('Informe o Nome Fantasia da empresa.');
      return;
    }
    if (!document.trim()) {
      setErrorMsg('Informe o CNPJ ou CPF da empresa.');
      return;
    }
    if (!adminEmail.trim()) {
      setErrorMsg('Informe o E-mail de login do Administrador.');
      return;
    }
    if (!password) {
      setErrorMsg('Informe uma senha para o Administrador.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('A senha do administrador deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          legal_name: legalName.trim() || undefined,
          document: document.trim(),
          email: companyEmail.trim() || undefined,
          phone: phone.trim() || undefined,
          timezone: timezone.trim() || 'America/Sao_Paulo',
          admin_name: adminName.trim() || 'Administrador',
          admin_email: adminEmail.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Erro ao realizar o bootstrap inicial da empresa.');
        if (data.error?.includes('Já existe um administrador')) {
          setIsLocked(true);
        }
      } else {
        setCreatedSummary({
          companyName: companyName.trim(),
          adminEmail: adminEmail.trim(),
        });
        setIsSuccess(true);
        // Clear passwords from component state
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMsg('Falha de conexão com o servidor de bootstrap.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/20 mx-auto">
            N
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NEXO Production</h1>
          <p className="text-xs text-slate-400">Configuração Inicial da Empresa & Primeiro Administrador (Bootstrap)</p>
        </div>

        {/* Loading status */}
        {isCheckingLock && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Verificando status de inicialização do sistema...
          </div>
        )}

        {/* Locked State Card */}
        {!isCheckingLock && isLocked && !isSuccess && (
          <div className="bg-slate-950 border border-amber-800/60 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-950/80 border border-amber-700/60 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Sistema Já Inicializado</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                O bootstrap inicial da empresa e do primeiro administrador já foi concluído neste ambiente.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
              Para cadastrar novos usuários ou gerenciar a operação, acesse a plataforma com sua conta administrativa.
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/30 transition-all"
              >
                Ir para o Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Success State Card */}
        {!isCheckingLock && isSuccess && (
          <div className="bg-slate-950 border border-emerald-800/80 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-950 border border-emerald-700 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Bootstrap Concluído com Sucesso!</h2>
              <p className="text-xs text-slate-400">A empresa e a conta administrativa foram criadas no sistema.</p>
            </div>

            {createdSummary && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-left text-xs space-y-1 text-slate-300">
                <p>
                  Empresa: <strong className="text-white">{createdSummary.companyName}</strong>
                </p>
                <p>
                  E-mail do Admin: <strong className="text-blue-400">{createdSummary.adminEmail}</strong>
                </p>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Acesse a tela de login para autenticar com suas credenciais e configurar sua planta industrial.
            </p>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all"
              >
                Ir para a Tela de Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Form State */}
        {!isCheckingLock && !isLocked && !isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-lg text-red-300 text-xs flex items-center gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-400 border-b border-slate-800 pb-2">
                <Building2 className="w-4 h-4" /> Dados da Empresa (Tenant)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Fantasia <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ex: Indústria Metalúrgica Vale"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ ou CPF <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="12.345.678/0001-90"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Razão Social (Opcional)</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="ex: Vale Indústria S/A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">E-mail da Empresa (Opcional)</label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Telefone (Opcional)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 4000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Fuso Horário</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Admin Account */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-400 border-b border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4" /> Primeiro Administrador (ADMIN)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Administrador</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Carlos Silva"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail do Administrador <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="carlos.admin@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Senha <span className="text-red-400">*</span> (mínimo 8 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmar Senha <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Inicializando Empresa...' : 'Criar Empresa & Primeiro Administrador'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">NEXO Soluções Industriais e Automação S/A — Produção B2B</p>
        </div>
      </div>
    </div>
  );
}
