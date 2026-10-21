'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { DowntimeCategory } from '@/types';
import { Building2, Cpu, Package, Clock, AlertTriangle, UserPlus, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';

export default function SetupWizardPage() {
  const router = useRouter();
  const { user, company, isLoading, reloadCompany } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user || user.role !== 'admin' || !company) {
      router.push('/dashboard');
      return;
    }

    if (company.setup_completed_at !== null && company.setup_completed_at !== undefined) {
      // Setup already completed for this company
      router.push('/dashboard');
    }
  }, [user, company, isLoading, router]);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1 - Company Info
  const [companyName, setCompanyName] = useState(company?.name || 'Metalúrgica Vale Industrial');
  const [legalName, setLegalName] = useState(company?.legal_name || 'Metalúrgica Vale Industrial S/A');
  const [document, setDocument] = useState(company?.document || '12.345.678/0001-90');
  const [email, setEmail] = useState(company?.email || 'contato@valeindustrial.com.br');
  const [phone, setPhone] = useState(company?.phone || '(11) 4004-9000');
  const [timezone, setTimezone] = useState(company?.timezone || 'America/Sao_Paulo');

  // Step 2 - Machines
  const [machines, setMachines] = useState<Array<{ name: string; code: string; sector: string; description: string }>>([
    { name: 'Torno CNC Romi Centur 30D', code: 'CNC-01', sector: 'Usinagem', description: 'Torno CNC principal' },
    { name: 'Prensa Hidráulica 200T', code: 'PRS-01', sector: 'Estamparia', description: 'Prensa para conformação' },
  ]);
  const [newMacName, setNewMacName] = useState('');
  const [newMacCode, setNewMacCode] = useState('');
  const [newMacSector, setNewMacSector] = useState('');

  // Step 3 - Products
  const [products, setProducts] = useState<Array<{ name: string; code: string; cycleTime: number; targetHr: number; targetScrap: number }>>([
    { name: 'Eixo Transmissão Aço 4140', code: 'PROD-101', cycleTime: 45, targetHr: 80, targetScrap: 1.5 },
  ]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCycle, setNewProdCycle] = useState(60);
  const [newProdHr, setNewProdHr] = useState(60);
  const [newProdScrap, setNewProdScrap] = useState(2.0);

  // Step 4 - Shifts
  const [shifts, setShifts] = useState<Array<{ name: string; startTime: string; endTime: string }>>([
    { name: 'Turno A', startTime: '06:00', endTime: '14:00' },
    { name: 'Turno B', startTime: '14:00', endTime: '22:00' },
    { name: 'Turno C', startTime: '22:00', endTime: '06:00' },
  ]);

  // Step 5 - Downtime Reasons
  const [reasons, setReasons] = useState<Array<{ name: string; category: DowntimeCategory }>>([
    { name: 'Setup de Ferramental', category: 'setup' },
    { name: 'Manutenção Preventiva', category: 'maintenance' },
    { name: 'Falta de Matéria-Prima', category: 'material' },
    { name: 'Falha Mecânica', category: 'mechanical' },
    { name: 'Falha Elétrica', category: 'electrical' },
    { name: 'Ajuste de Parâmetro', category: 'adjustment' },
    { name: 'Inspeção de Qualidade', category: 'quality' },
    { name: 'Ausência de Operador', category: 'operator' },
  ]);

  // Step 6 - Initial Operator
  const [opName, setOpName] = useState('João Pedro');
  const [opEmail, setOpEmail] = useState('operador@nexoproduction.demo');

  const addMachine = () => {
    if (!newMacName || !newMacCode) return;
    setMachines([...machines, { name: newMacName, code: newMacCode, sector: newMacSector || 'Geral', description: '' }]);
    setNewMacName('');
    setNewMacCode('');
    setNewMacSector('');
  };

  const removeMachine = (index: number) => {
    setMachines(machines.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    if (!newProdName || !newProdCode) return;
    setProducts([...products, { name: newProdName, code: newProdCode, cycleTime: newProdCycle, targetHr: newProdHr, targetScrap: newProdScrap }]);
    setNewProdName('');
    setNewProdCode('');
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleFinishSetup = async () => {
    if (isSubmitting) return; // Prevent duplicate execution
    setIsSubmitting(true);
    try {
      const compId = company?.id || '00000000-0000-0000-0000-000000000001';

      // 1. Update Company & Record Explicit Setup Completion Timestamp
      await repositories.company.update(compId, {
        name: companyName,
        legal_name: legalName,
        document,
        email,
        phone,
        timezone,
        setup_completed_at: new Date().toISOString(),
      });

      // 2. Save Machines Idempotently
      for (const m of machines) {
        const existing = await repositories.machines.getByCode(compId, m.code);
        if (!existing) {
          await repositories.machines.create({
            company_id: compId,
            name: m.name,
            code: m.code,
            sector: m.sector,
            description: m.description,
            status: 'inactive',
            active: true,
          });
        }
      }

      // 3. Save Products Idempotently
      const existingProducts = await repositories.products.getAll(compId);
      for (const p of products) {
        const exists = existingProducts.some((ep) => ep.code === p.code);
        if (!exists) {
          await repositories.products.create({
            company_id: compId,
            name: p.name,
            code: p.code,
            description: '',
            target_cycle_time_seconds: p.cycleTime,
            target_quantity_per_hour: p.targetHr,
            target_scrap_percentage: p.targetScrap,
            active: true,
          });
        }
      }

      // 4. Save Shifts Idempotently
      const existingShifts = await repositories.company.getShifts(compId);
      for (const s of shifts) {
        const exists = existingShifts.some((es) => es.name === s.name);
        if (!exists) {
          await repositories.company.createShift({
            company_id: compId,
            name: s.name,
            start_time: s.startTime,
            end_time: s.endTime,
            active: true,
          });
        }
      }

      // 5. Save Downtime Reasons Idempotently
      const existingReasons = await repositories.downtime.getReasons(compId);
      for (const r of reasons) {
        const exists = existingReasons.some((er) => er.name === r.name);
        if (!exists) {
          await repositories.downtime.createReason({
            company_id: compId,
            name: r.name,
            category: r.category,
            active: true,
          });
        }
      }

      // 6. Provision First Operator Safely via Server Endpoint
      await fetch('/api/setup/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: opName, email: opEmail }),
      });

      if (reloadCompany) {
        await reloadCompany();
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Setup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando dados da sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/20">
            N
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">NEXO Production</h1>
            <p className="text-xs text-slate-400">Wizard de Configuração Inicial da Empresa</p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-800 text-blue-400 rounded-full border border-slate-700">
          Etapa {step} de 7
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="max-w-4xl mx-auto w-full mb-8">
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <div
              key={num}
              className={`h-2 rounded-full transition-all duration-300 ${
                num === step
                  ? 'bg-blue-500 shadow-sm shadow-blue-500/50'
                  : num < step
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl flex-1">
        {/* STEP 1: COMPANY */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Building2 className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 1: Dados da Empresa</h2>
                <p className="text-sm text-slate-400">Informe os dados cadastrais da sua planta industrial.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fuso Horário</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MACHINES */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Cpu className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 2: Cadastrar Máquinas</h2>
                <p className="text-sm text-slate-400">Adicione as máquinas e equipamentos que serão monitorados.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-blue-400">Nova Máquina</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nome (ex: Torno CNC 01)"
                  value={newMacName}
                  onChange={(e) => setNewMacName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Código (ex: CNC-01)"
                  value={newMacCode}
                  onChange={(e) => setNewMacCode(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Setor (ex: Usinagem)"
                  value={newMacSector}
                  onChange={(e) => setNewMacSector(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <button
                type="button"
                onClick={addMachine}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar Máquina
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">Máquinas Cadastradas ({machines.length})</h3>
              {machines.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                  <div>
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className="ml-2 text-xs font-mono text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50">{m.code}</span>
                    <span className="ml-2 text-xs text-slate-400">Setor: {m.sector}</span>
                  </div>
                  <button type="button" onClick={() => removeMachine(i)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: PRODUCTS */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Package className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 3: Cadastrar Produtos</h2>
                <p className="text-sm text-slate-400">Informe os itens fabricados e suas metas operacionais padrão.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-blue-400">Novo Produto</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Código SK/OP (ex: PROD-101)"
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400">Ciclo Padrão (seg)</label>
                  <input
                    type="number"
                    value={newProdCycle}
                    onChange={(e) => setNewProdCycle(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Meta (peças/hora)</label>
                  <input
                    type="number"
                    value={newProdHr}
                    onChange={(e) => setNewProdHr(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Meta Refugo (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProdScrap}
                    onChange={(e) => setNewProdScrap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar Produto
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">Produtos Cadastrados ({products.length})</h3>
              {products.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                  <div>
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="ml-2 text-xs font-mono text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50">{p.code}</span>
                    <span className="ml-2 text-xs text-slate-400">Meta: {p.targetHr} pçs/h | Ciclo: {p.cycleTime}s</span>
                  </div>
                  <button type="button" onClick={() => removeProduct(i)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: SHIFTS */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Clock className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 4: Configurar Turnos de Trabalho</h2>
                <p className="text-sm text-slate-400">Defina a jornada dos turnos operacionais (suporta turnos noturnos).</p>
              </div>
            </div>

            <div className="space-y-3">
              {shifts.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="font-bold text-white text-sm">{s.name}</span>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="bg-slate-900 px-3 py-1 rounded border border-slate-800 font-mono">{s.startTime}</span>
                    <span>até</span>
                    <span className="bg-slate-900 px-3 py-1 rounded border border-slate-800 font-mono">{s.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: DOWNTIME REASONS */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <AlertTriangle className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 5: Motivos de Parada Padrão</h2>
                <p className="text-sm text-slate-400">O sistema pré-configura as principais categorias industriais de parada.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reasons.map((r, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">{r.name}</span>
                  <span className="text-xs uppercase px-2 py-0.5 rounded font-mono bg-slate-800 text-blue-400">{r.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: INITIAL OPERATOR */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <UserPlus className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 6: Cadastrar Primeiro Operador</h2>
                <p className="text-sm text-slate-400">Cadastre a conta de acesso para a interface operacional no chão de fábrica.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Operador</label>
                <input
                  type="text"
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail de Login do Operador</label>
                <input
                  type="email"
                  value={opEmail}
                  onChange={(e) => setOpEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: SUMMARY & CONCLUSION */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Etapa 7: Configuração Concluída!</h2>
                <p className="text-sm text-slate-400">Revise os parâmetros iniciais antes de ativar a plataforma.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <h3 className="font-bold text-blue-400">Empresa</h3>
                <p className="text-white font-semibold">{companyName}</p>
                <p className="text-xs text-slate-400">CNPJ: {document}</p>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <h3 className="font-bold text-blue-400">Recursos Cadastrados</h3>
                <p className="text-xs text-slate-300">Máquinas: <strong className="text-white">{machines.length}</strong></p>
                <p className="text-xs text-slate-300">Produtos: <strong className="text-white">{products.length}</strong></p>
                <p className="text-xs text-slate-300">Turnos: <strong className="text-white">{shifts.length}</strong></p>
                <p className="text-xs text-slate-300">Operador: <strong className="text-white">{opName}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-t border-slate-800 pt-6 mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        ) : (
          <div />
        )}

        {step < 7 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            Avançar <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinishSetup}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? 'Ativando...' : 'COMEÇAR A USAR O NEXO'}
          </button>
        )}
      </div>
    </div>
  );
}
