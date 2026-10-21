import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  GraduationCap, 
  ExternalLink, 
  Copy, 
  Zap, 
  KeyRound, 
  UserPlus, 
  Trash2,
  MonitorCheck,
  AlertTriangle
} from 'lucide-react';

export const SettingsView = () => {
  const { 
    addAlert, 
    setPortalMode, 
    showToast, 
    credentialsList, 
    addCredential, 
    removeCredential,
    triggerUnscheduledCut
  } = useApp();

  const [laserThresholdAmp, setLaserThresholdAmp] = useState(3.0);
  const [maxAllowedAmp, setMaxAllowedAmp] = useState(7.5);

  // Credential creation state
  const [newLoginId, setNewLoginId] = useState('');
  const [newRole, setNewRole] = useState('Técnico de Laboratório');
  const [newDepartment, setNewDepartment] = useState('Laboratório Maker / Manufatura Digital');
  const [newPassword, setNewPassword] = useState('');

  const studentPortalUrl = `${window.location.origin}${window.location.pathname}?mode=student`;

  const handleSave = (e) => {
    e.preventDefault();
    addAlert('SUCCESS', `Limites de corrente atualizados: Limiar de Feixe Ativo ${laserThresholdAmp}A | Máximo ${maxAllowedAmp}A.`);
    showToast({
      type: 'SUCCESS',
      badge: 'CONFIGURAÇÕES SALVAS',
      title: 'Parâmetros de Corrente Atualizados',
      message: `Detecção de corte ativo em > ${laserThresholdAmp}A e alerta de sobrecorrente em ${maxAllowedAmp}A.`
    });
  };

  const handleCreateCredential = (e) => {
    e.preventDefault();
    if (!newLoginId.trim() || !newPassword.trim()) return;
    addCredential({
      loginId: newLoginId,
      role: newRole,
      department: newDepartment
    });
    setNewLoginId('');
    setNewPassword('');
  };

  const handleOpenStudentTab = () => {
    window.open(studentPortalUrl, '_blank');
  };

  const handleCopyStudentLink = () => {
    navigator.clipboard.writeText(studentPortalUrl);
    showToast({
      type: 'SUCCESS',
      badge: 'LINK COPIADO',
      title: 'URL do Módulo do Aluno Copiada',
      message: 'Você pode abrir em outra guia ou enviar para os computadores dos alunos.'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          <span>CONFIGURAÇÕES DO SISTEMA, MÓDULO DO ALUNO & CREDENCIAIS</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Acesso ao Portal do Aluno, gestão de credenciais institucionais de acesso e calibração do sensor de corrente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CARD 1: ACESSO AO MÓDULO DO ALUNO */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  MÓDULO EXTERNO INTEGRADO
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Portal de Requisições do Aluno
                </h2>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
              SINCRONIZADO EM TEMPO REAL
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            O módulo do aluno funciona de forma independente do painel do operador. Abra-o em uma <strong>segunda guia lado a lado</strong> (ou em outro computador): assim que o aluno enviar um pedido de corte, um <strong>pop-up de notificação em tempo real</strong> aparecerá imediatamente na tela do operador.
          </p>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              URL Direta do Portal do Aluno
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-emerald-800 truncate">{studentPortalUrl}</code>
              <button
                type="button"
                onClick={handleCopyStudentLink}
                className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleOpenStudentTab}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir Módulo do Aluno (Nova Guia)</span>
            </button>

            <button
              type="button"
              onClick={() => setPortalMode('STUDENT')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Alternar Nesta Guia</span>
            </button>
          </div>
        </div>

        {/* CARD 2: PARÂMETROS DE CORRENTE NÃO-INVASIVA & CORTE AVULSO */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Calibração de Corrente Elétrica (A) & Automação de Bancada</span>
            </h2>
            <p className="text-xs text-slate-500">
              Defina o limiar de corrente para reconhecer início automático de corte laser
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Limiar de Feixe Laser Ativo (A)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={laserThresholdAmp}
                  onChange={(e) => setLaserThresholdAmp(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Alerta de Sobrecorrente (A)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={maxAllowedAmp}
                  onChange={(e) => setMaxAllowedAmp(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Testar detecção de corte avulso iniciado sem OS:</span>
              </div>
              <button
                type="button"
                onClick={() => triggerUnscheduledCut('LASER-01')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
              >
                Simular Corte Sem OS (M01)
              </button>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>SALVAR CALIBRAÇÃO DE CORRENTE</span>
            </button>
          </form>
        </div>

      </div>

      {/* CARD 3: GESTÃO DE CREDENCIAIS E PERFIS DE ACESSO (IMPESSOAL) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>GESTÃO DE CREDENCIAIS E PERFIS DE ACESSO</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cadastro de credenciais institucionais por cargo/função (Técnico de Laboratório, Professor Responsável e Operador de Bancada)
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {credentialsList.length} Perfis Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form to create new credential */}
          <form onSubmit={handleCreateCredential} className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Cadastrar Nova Credencial de Acesso</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Identificador / Login Institucional *</label>
              <input
                type="text"
                placeholder="Ex: TECNICO-TURNO-NOITE ou SP300000"
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Cargo / Perfil Institucional *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="Técnico de Laboratório">Técnico de Laboratório</option>
                <option value="Professor Responsável">Professor Responsável</option>
                <option value="Operador de Bancada">Operador de Bancada</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Setor / Alocação *</label>
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Senha de Acesso *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              + Cadastrar Credencial de Acesso
            </button>
          </form>

          {/* List of active credentials */}
          <div className="lg:col-span-7 space-y-2.5">
            {credentialsList.map(cred => (
              <div
                key={cred.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{cred.loginId}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {cred.role}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {cred.department} • Criado em {cred.createdAt}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeCredential(cred.id)}
                  className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                  title="Remover credencial"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
