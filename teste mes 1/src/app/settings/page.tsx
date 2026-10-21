'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { ApiKey, Profile } from '@/types';
import { Settings, Key, Building2, Users, Plus, Edit2, ShieldCheck, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { company, role: currentRole } = useAuth();
  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'apikeys'>('company');

  const [users, setUsers] = useState<Profile[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'operator' | 'supervisor'>('operator');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'operator' | 'supervisor'>('operator');
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // API Key Generator State
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const loadData = async () => {
    try {
      const [uList, kList] = await Promise.all([
        repositories.users.getAll(compId),
        repositories.apiKeys.getAll(compId),
      ]);
      setUsers(uList);
      setApiKeys(kList);
    } catch (err) {
      console.error('Failed to load settings data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setCreateError(json.error || 'Erro ao cadastrar usuário.');
        return;
      }

      setShowCreateModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('operator');
      setNewUserPassword('');
      setCreateSuccessMsg('Usuário cadastrado com sucesso!');
      await loadData();

      setTimeout(() => setCreateSuccessMsg(''), 4000);
    } catch (err: any) {
      setCreateError(err.message || 'Erro de conexão ao cadastrar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: Profile) => {
    if (user.role === 'admin') return; // Cannot edit admin via team management
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role === 'supervisor' ? 'supervisor' : 'operator');
    setEditActive(user.active ?? true);
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          active: editActive,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setEditError(json.error || 'Erro ao atualizar usuário.');
        return;
      }

      setShowEditModal(false);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar usuário.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName) return;
    const rawKey = `nexo_${Math.random().toString(36).substr(2, 16)}_${Date.now()}`;
    const hash = `hash_${rawKey}`;

    await repositories.apiKeys.create({
      company_id: compId,
      name: newKeyName,
      key_hash: hash,
      active: true,
    });

    setGeneratedKey(rawKey);
    setNewKeyName('');
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-extrabold text-white">Configurações da Plataforma</h1>
            <p className="text-xs text-slate-400">Parâmetros da empresa, gestão de usuários e chaves de API industriais.</p>
          </div>

          {createSuccessMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{createSuccessMsg}</span>
            </div>
          )}

          {/* Settings Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'company' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Empresa
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Usuários & Equipe
            </button>
            <button
              onClick={() => setActiveTab('apikeys')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'apikeys' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" /> Chaves de API Industriais
            </button>
          </div>

          {/* TAB 1: COMPANY */}
          {activeTab === 'company' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-2xl">
              <h2 className="text-base font-bold text-white">Parâmetros da Empresa</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    disabled
                    value={company?.name || 'Metalúrgica Vale Industrial'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Razão Social</label>
                  <input
                    type="text"
                    disabled
                    value={company?.legal_name || 'Metalúrgica Vale Industrial S/A'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CNPJ</label>
                  <input
                    type="text"
                    disabled
                    value={company?.document || '12.345.678/0001-90'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Gestão da Equipe Fabril ({users.length} Usuários)</h2>
                  <p className="text-xs text-slate-400">Cadastre e gerencie o acesso de Operadores e Supervisores da planta industrial.</p>
                </div>
                {currentRole === 'admin' && (
                  <button
                    onClick={() => {
                      setCreateError('');
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="w-4 h-4" /> Adicionar usuário
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Nome</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Função (Role)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Data de Criação</th>
                      {currentRole === 'admin' && <th className="p-3 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => {
                      const isUserActive = u.active ?? true;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{u.email}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded font-extrabold uppercase text-[10px] ${
                                u.role === 'admin'
                                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                                  : u.role === 'supervisor'
                                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                                  : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                              }`}
                            >
                              {u.role === 'admin' ? 'ADMINISTRADOR' : u.role === 'supervisor' ? 'SUPERVISOR' : 'OPERADOR'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isUserActive
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {isUserActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          {currentRole === 'admin' && (
                            <td className="p-3 text-right">
                              {u.role !== 'admin' ? (
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-400" /> Editar
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Titan Principal</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: API KEYS */}
          {activeTab === 'apikeys' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Chaves de API para Integração Máquina-a-Máquina</h2>
                <p className="text-xs text-slate-400">Gere API Keys autenticadas para envios de telemetria por gateways, CLPs ou ESP32.</p>
              </div>

              {/* Generator Form */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-blue-400">Gerar Nova API Key</span>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Nome da integração (ex: Gateway CLP Usinagem)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateApiKey}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Gerar Chave
                  </button>
                </div>

                {generatedKey && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-emerald-300 block">Chave Gerada com Sucesso (Copie agora, ela não será exibida novamente):</span>
                    <code className="block p-2 bg-slate-900 text-emerald-400 font-mono rounded select-all border border-emerald-900">
                      {generatedKey}
                    </code>
                  </div>
                )}
              </div>

              {/* Keys List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300">Chaves Ativas</h3>
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{k.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">Hash: {k.key_hash.substr(0, 20)}...</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Ativa
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Cadastrar Novo Membro da Equipe</h2>

            {createError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-300 text-xs font-medium">
                {createError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="ex: João Pedro da Silva"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="operador@empresa.com.br"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Função / Perfil (Role)</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'operator' | 'supervisor')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="operator">Operador (Acesso ao Chão de Fábrica)</option>
                <option value="supervisor">Supervisor (Gestão Operacional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Senha Provisória (Mínimo 8 caracteres)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Você poderá alterar ou redefinir este acesso posteriormente.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateUser} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Editar Usuário</h2>
            <p className="text-xs text-slate-400 font-mono">{editingUser.email}</p>

            {editError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-300 text-xs font-medium">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Função / Perfil (Role)</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'operator' | 'supervisor')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="operator">Operador (Acesso ao Chão de Fábrica)</option>
                <option value="supervisor">Supervisor (Gestão Operacional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status da Conta</label>
              <select
                value={editActive ? 'true' : 'false'}
                onChange={(e) => setEditActive(e.target.value === 'true')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo (Acesso suspenso)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

