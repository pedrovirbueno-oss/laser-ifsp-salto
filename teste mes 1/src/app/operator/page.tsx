'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { repositories } from '@/repositories';
import { ProductionService } from '@/services/productionService';
import { deriveMachineStatus, DynamicMachineState } from '@/lib/machineStatus';
import { Machine, ProductionOrder, Product, Shift, DowntimeReason, ProductionRecord, DowntimeRecord } from '@/types';
import { Play, PlusCircle, PauseCircle, CheckCircle2, RotateCcw, Clock, AlertTriangle, LayoutDashboard, LogOut } from 'lucide-react';

export default function OperatorPage() {
  const { user, company, role, logout, isLoading: authLoading } = useAuth();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [reasons, setReasons] = useState<DowntimeReason[]>([]);

  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const [activeProduction, setActiveProduction] = useState<ProductionRecord | null>(null);
  const [activeDowntime, setActiveDowntime] = useState<DowntimeRecord | null>(null);

  // Modals state
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [showRegProdModal, setShowRegProdModal] = useState<boolean>(false);
  const [showDowntimeModal, setShowDowntimeModal] = useState<boolean>(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);

  // Form inputs
  const [regProduced, setRegProduced] = useState<number>(50);
  const [regRejected, setRegRejected] = useState<number>(0);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Live Timers
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);

  // Submission Guard
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const compId = company?.id || '00000000-0000-0000-0000-000000000001';

  const loadOperatorData = async () => {
    try {
      const [macs, sfts, prods, ords, reas] = await Promise.all([
        repositories.machines.getAll(compId),
        repositories.company.getShifts(compId),
        repositories.products.getAll(compId),
        repositories.orders.getAll(compId),
        repositories.downtime.getReasons(compId),
      ]);

      setMachines(macs);
      setShifts(sfts);
      setProducts(prods);
      setOrders(ords);
      setReasons(reas);

      if (macs.length > 0 && !selectedMachineId) {
        setSelectedMachineId(macs[0].id);
      }
      if (sfts.length > 0 && !selectedShiftId) {
        setSelectedShiftId(sfts[0].id);
      }
      if (ords.length > 0 && !selectedOrderId) {
        const firstAvailable = ords.find((o) => o.status === 'active' || o.status === 'planned');
        if (firstAvailable) setSelectedOrderId(firstAvailable.id);
      }
    } catch (err) {
      console.error('Failed to load operator data:', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadOperatorData();
  }, [company?.id, authLoading]);

  // Load Active Sessions when Machine Changes
  useEffect(() => {
    if (!selectedMachineId || authLoading) return;
    async function loadActiveSessions() {
      const [prod, down] = await Promise.all([
        repositories.production.getActiveByMachine(compId, selectedMachineId),
        repositories.downtime.getActiveByMachine(compId, selectedMachineId),
      ]);
      setActiveProduction(prod);
      setActiveDowntime(down);
    }
    loadActiveSessions();
  }, [selectedMachineId, compId, authLoading]);


  // Live Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeDowntime?.start_time) {
        const start = new Date(activeDowntime.start_time).getTime();
        setElapsedSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      } else if (activeProduction?.start_time) {
        const start = new Date(activeProduction.start_time).getTime();
        setElapsedSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      } else {
        setElapsedSecs(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeProduction, activeDowntime]);

  const currentMachine = machines.find((m) => m.id === selectedMachineId);
  const currentOrder = orders.find((o) => o.id === (activeProduction?.order_id || selectedOrderId));
  const currentProduct = products.find((p) => p.id === currentOrder?.product_id);
  const machineState: DynamicMachineState = deriveMachineStatus(activeProduction, activeDowntime);

  // Format Elapsed Time HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Action Handlers
  const handleStartProductionSubmit = async () => {
    if (!selectedMachineId || !selectedOrderId || !selectedShiftId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ord = orders.find((o) => o.id === selectedOrderId);
      const prod = products.find((p) => p.id === ord?.product_id);

      const record = await ProductionService.startProduction({
        companyId: compId,
        machineId: selectedMachineId,
        operatorId: user?.id || 'user-operator-demo',
        operatorName: user?.name || 'João Pedro',
        orderId: selectedOrderId,
        orderCode: ord?.code || '',
        productId: prod?.id || '',
        productName: prod?.name || '',
        shiftId: selectedShiftId,
      });

      setActiveProduction(record);
      setShowStartModal(false);
      await loadOperatorData();
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar produção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterProductionSubmit = async () => {
    if (!activeProduction || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await ProductionService.registerProduction({
        companyId: compId,
        recordId: activeProduction.id,
        operatorId: user?.id || 'user-operator-demo',
        operatorName: user?.name || 'João Pedro',
        producedQuantity: Number(regProduced),
        rejectedQuantity: Number(regRejected),
        notes,
      });
      setActiveProduction(updated);
      setShowRegProdModal(false);
      setRegProduced(50);
      setRegRejected(0);
      setNotes('');
      await loadOperatorData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar produção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDowntimeSubmit = async () => {
    if (!selectedMachineId || !selectedReasonId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const downtime = await ProductionService.startDowntime({
        companyId: compId,
        machineId: selectedMachineId,
        operatorId: user?.id || 'user-operator-demo',
        operatorName: user?.name || 'João Pedro',
        orderId: activeProduction?.order_id,
        reasonId: selectedReasonId,
        notes,
      });
      setActiveDowntime(downtime);
      setShowDowntimeModal(false);
      await loadOperatorData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar parada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeProduction = async () => {
    if (!activeDowntime || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await ProductionService.endDowntime({
        companyId: compId,
        downtimeId: activeDowntime.id,
        operatorId: user?.id || 'user-operator-demo',
        operatorName: user?.name || 'João Pedro',
      });
      setActiveDowntime(null);
      await loadOperatorData();
    } catch (err: any) {
      alert(err.message || 'Erro ao retomar produção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishProductionSubmit = async () => {
    if (!activeProduction || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await ProductionService.endProduction({
        companyId: compId,
        recordId: activeProduction.id,
        operatorId: user?.id || 'user-operator-demo',
        operatorName: user?.name || 'João Pedro',
      });
      setActiveProduction(null);
      setShowFinishConfirm(false);
      await loadOperatorData();
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar produção');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col justify-between max-w-5xl mx-auto">
      {/* Top Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center justify-between md:block">
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">Terminal do Operador</span>
              <h1 className="text-2xl font-extrabold text-white">{user?.name || 'João Pedro'}</h1>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              {role !== 'operator' && (
                <Link
                  href="/dashboard"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => logout()}
                title="Sair"
                className="p-2 bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Machine Selector */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Máquina:</span>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Selector */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Turno:</span>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.start_time}-{s.end_time})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Navigation & Logout (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {role !== 'operator' && (
                <Link
                  href="/dashboard"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" /> Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => logout()}
                title="Trocar Usuário / Sair"
                className="px-3 py-2 bg-slate-950 hover:bg-red-950/50 border border-slate-800 hover:border-red-800/60 text-slate-300 hover:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </div>
        </div>

        {/* Current Active OP Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Ordem Atual</span>
            <span className="text-base font-extrabold text-blue-400 font-mono">
              {activeProduction ? activeProduction.order_code || currentOrder?.code || 'OP Ativa' : 'Nenhuma'}
            </span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Produto</span>
            <span className="text-sm font-bold text-white truncate block">
              {activeProduction?.product_name || currentProduct?.name || 'Selecione uma OP'}
            </span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Status da Máquina</span>
            <span className="text-sm font-bold block">{machineState.statusBadge}</span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 block mb-0.5">Cronômetro</span>
              <span className="text-base font-extrabold text-white font-mono">{formatTimer(elapsedSecs)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production & Scrap Live Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Produção Acumulada</span>
            <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {activeProduction ? activeProduction.produced_quantity : 0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">peças boas produzidas</span>
          </div>
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Refugo Acumulado</span>
            <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {activeProduction ? activeProduction.rejected_quantity : 0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">peças rejeitadas</span>
          </div>
          <AlertTriangle className="w-12 h-12 text-red-500/40" />
        </div>
      </div>

      {/* LARGE TOUCH ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {!activeProduction && !activeDowntime && (
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            className="w-full py-8 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xl font-extrabold shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all"
          >
            <Play className="w-8 h-8 fill-current" /> INICIAR PRODUÇÃO
          </button>
        )}

        {activeProduction && !activeDowntime && (
          <>
            <button
              type="button"
              onClick={() => setShowRegProdModal(true)}
              className="w-full py-8 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-xl font-extrabold shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all"
            >
              <PlusCircle className="w-8 h-8" /> REGISTRAR PRODUÇÃO
            </button>

            <button
              type="button"
              onClick={() => setShowDowntimeModal(true)}
              className="w-full py-8 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-2xl text-xl font-extrabold shadow-2xl shadow-amber-600/30 flex items-center justify-center gap-3 transition-all"
            >
              <PauseCircle className="w-8 h-8" /> REGISTRAR PARADA
            </button>
          </>
        )}

        {activeDowntime && (
          <button
            type="button"
            onClick={handleResumeProduction}
            className="w-full py-8 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xl font-extrabold shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all col-span-2"
          >
            <RotateCcw className="w-8 h-8" /> RETOMAR PRODUÇÃO
          </button>
        )}

        {activeProduction && !activeDowntime && (
          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            className="w-full py-6 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all col-span-2 border border-slate-700"
          >
            FINALIZAR PRODUÇÃO
          </button>
        )}
      </div>

      {/* START PRODUCTION MODAL */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-white">Iniciar Nova Sessão de Produção</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Selecione a Ordem de Produção (OP)</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white font-bold"
              >
                <option value="">Selecione a OP...</option>
                {orders
                  .filter((o) => o.status === 'planned' || o.status === 'active')
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} - {o.product_name} ({o.produced_quantity}/{o.planned_quantity} pçs)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartProductionSubmit}
                className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm"
              >
                Confirmar Início
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER PRODUCTION MODAL */}
      {showRegProdModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-white">Apontamento de Peças Produzidas</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade Produzida (Total)</label>
              <input
                type="number"
                min="0"
                value={regProduced}
                onChange={(e) => setRegProduced(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-lg font-extrabold text-white text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade Rejeitada (Refugo)</label>
              <input
                type="number"
                min="0"
                value={regRejected}
                onChange={(e) => setRegRejected(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-lg font-extrabold text-red-400 text-center"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowRegProdModal(false)}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegisterProductionSubmit}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm"
              >
                Salvar Apontamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOWNTIME MODAL */}
      {showDowntimeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Selecione o Motivo da Parada</h2>

            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReasonId(r.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    selectedReasonId === r.id
                      ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block">{r.name}</span>
                  <span className="text-[10px] text-amber-300 uppercase font-mono">{r.category}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDowntimeModal(false)}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedReasonId}
                onClick={handleStartDowntimeSubmit}
                className="w-1/2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm"
              >
                Iniciar Parada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESTRUCTIVE CONFIRMATION MODAL (FINALIZAR PRODUÇÃO) */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Deseja realmente encerram a sessão de produção?</h2>
            <p className="text-xs text-slate-400">
              Essa ação irá encerrar os registros da ordem atual na máquina selecionada. Os dados acumulados serão preservados.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinishProductionSubmit}
                className="w-1/2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm"
              >
                Sim, Encerram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
