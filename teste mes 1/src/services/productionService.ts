import { repositories, isTestUserSessionActive } from '@/repositories';
import { createAuditLogEntry } from '@/lib/audit';
import { deriveMachineStatus } from '@/lib/machineStatus';
import { ProductionRecord, DowntimeRecord } from '@/types';

function shouldUseProductionApi(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === 'false' &&
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    !isTestUserSessionActive()
  );
}

export class ProductionService {
  /**
   * Starts production session on a machine for a given OP, product & shift.
   * Logs START_PRODUCTION audit action.
   */
  static async startProduction(params: {
    companyId: string;
    machineId: string;
    operatorId: string;
    operatorName: string;
    orderId: string;
    orderCode: string;
    productId: string;
    productName: string;
    shiftId: string;
  }): Promise<ProductionRecord> {
    const { companyId, machineId, operatorId, operatorName, orderId, orderCode, productId, productName, shiftId } = params;

    if (shouldUseProductionApi()) {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          machine_id: machineId,
          order_id: orderId,
          order_code: orderCode,
          product_id: productId,
          product_name: productName,
          shift_id: shiftId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao iniciar produção');
      return json.data;
    }

    // Check if machine already has active production or downtime
    const activeProd = await repositories.production.getActiveByMachine(companyId, machineId);
    if (activeProd) {
      throw new Error('Esta máquina já possui uma sessão de produção ativa.');
    }
    const activeDown = await repositories.downtime.getActiveByMachine(companyId, machineId);
    if (activeDown) {
      throw new Error('Esta máquina possui uma parada em andamento. Finalize a parada antes de iniciar a produção.');
    }

    // Create production record (Primary Persistence)
    const record = await repositories.production.create({
      company_id: companyId,
      machine_id: machineId,
      operator_id: operatorId,
      operator_name: operatorName,
      order_id: orderId,
      order_code: orderCode,
      product_id: productId,
      product_name: productName,
      shift_id: shiftId,
      start_time: new Date().toISOString(),
      produced_quantity: 0,
      rejected_quantity: 0,
    });

    // Secondary updates (Defensive handling)
    try {
      if (orderId) {
        await repositories.orders.update(companyId, orderId, { status: 'active' });
      }
    } catch (err) {
      console.warn('Falha ao atualizar status da ordem de produção:', err);
    }

    try {
      await repositories.machines.update(companyId, machineId, { status: 'producing' });
    } catch (err) {
      console.warn('Falha ao atualizar status da máquina:', err);
    }

    try {
      await repositories.audit.create(
        createAuditLogEntry(
          companyId,
          operatorId,
          operatorName,
          'START_PRODUCTION',
          'PRODUCTION_RECORD',
          record.id,
          null,
          { machineId, orderCode, productName }
        )
      );
    } catch (err) {
      console.warn('Falha ao registrar log de auditoria de início de produção:', err);
    }

    return record;
  }

  /**
   * Registers production batch output and scrap.
   * Validates non-negative values.
   * Logs REGISTER_PRODUCTION audit action.
   */
  static async registerProduction(params: {
    companyId: string;
    recordId: string;
    operatorId: string;
    operatorName: string;
    producedQuantity: number;
    rejectedQuantity: number;
    notes?: string;
  }): Promise<ProductionRecord> {
    const { companyId, recordId, operatorId, operatorName, producedQuantity, rejectedQuantity, notes } = params;

    if (producedQuantity < 0 || rejectedQuantity < 0) {
      throw new Error('A quantidade produzida e rejeitada não podem ser negativas.');
    }

    if (shouldUseProductionApi()) {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          record_id: recordId,
          produced_quantity: producedQuantity,
          rejected_quantity: rejectedQuantity,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao registrar produção');
      return json.data;
    }

    const allRecords = await repositories.production.getAll(companyId);
    const existing = allRecords.find((r) => r.id === recordId);
    if (!existing) {
      throw new Error('Registro de produção não encontrado.');
    }

    const newProduced = (existing.produced_quantity || 0) + producedQuantity;
    const newRejected = (existing.rejected_quantity || 0) + rejectedQuantity;

    const updatedRecord = await repositories.production.update(companyId, recordId, {
      produced_quantity: newProduced,
      rejected_quantity: newRejected,
      notes: notes || existing.notes,
    });

    // Secondary order total update
    if (existing.order_id) {
      try {
        const order = await repositories.orders.getById(companyId, existing.order_id);
        if (order) {
          await repositories.orders.update(companyId, order.id, {
            produced_quantity: (order.produced_quantity || 0) + producedQuantity,
            rejected_quantity: (order.rejected_quantity || 0) + rejectedQuantity,
          });
        }
      } catch (err) {
        console.warn('Falha ao atualizar totais da ordem:', err);
      }
    }

    // Secondary audit log
    try {
      await repositories.audit.create(
        createAuditLogEntry(
          companyId,
          operatorId,
          operatorName,
          'REGISTER_PRODUCTION',
          'PRODUCTION_RECORD',
          recordId,
          { produced: existing.produced_quantity, rejected: existing.rejected_quantity },
          { addedProduced: producedQuantity, addedRejected: rejectedQuantity, totalProduced: newProduced }
        )
      );
    } catch (err) {
      console.warn('Falha ao registrar audit log de apontamento:', err);
    }

    return updatedRecord;
  }

  /**
   * Starts a downtime event on a machine.
   * Logs START_DOWNTIME audit action.
   */
  static async startDowntime(params: {
    companyId: string;
    machineId: string;
    operatorId: string;
    operatorName: string;
    orderId?: string;
    reasonId: string;
    notes?: string;
  }): Promise<DowntimeRecord> {
    const { companyId, machineId, operatorId, operatorName, orderId, reasonId, notes } = params;

    if (shouldUseProductionApi()) {
      const res = await fetch('/api/downtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          machine_id: machineId,
          order_id: orderId || undefined,
          reason_id: reasonId,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao iniciar parada');
      return json.data;
    }

    const activeDown = await repositories.downtime.getActiveByMachine(companyId, machineId);
    if (activeDown) {
      throw new Error('Esta máquina já possui uma parada ativa.');
    }

    const reasons = await repositories.downtime.getReasons(companyId);
    const reasonObj = reasons.find((r) => r.id === reasonId);

    const downtime = await repositories.downtime.create({
      company_id: companyId,
      machine_id: machineId,
      operator_id: operatorId,
      order_id: orderId || '',
      reason_id: reasonId,
      reason_name: reasonObj?.name,
      category: reasonObj?.category,
      start_time: new Date().toISOString(),
      duration_seconds: 0,
      notes,
    });

    // Secondary machine status update
    try {
      const cat = reasonObj?.category || 'other';
      let machineStatus: 'stopped' | 'setup' | 'maintenance' = 'stopped';
      if (cat === 'setup') machineStatus = 'setup';
      if (cat === 'maintenance') machineStatus = 'maintenance';

      await repositories.machines.update(companyId, machineId, { status: machineStatus });
    } catch (err) {
      console.warn('Falha ao atualizar status da máquina na parada:', err);
    }

    // Secondary audit log
    try {
      await repositories.audit.create(
        createAuditLogEntry(
          companyId,
          operatorId,
          operatorName,
          'START_DOWNTIME',
          'DOWNTIME_RECORD',
          downtime.id,
          null,
          { machineId, reasonName: reasonObj?.name, category: reasonObj?.category || 'other' }
        )
      );
    } catch (err) {
      console.warn('Falha ao registrar audit log na parada:', err);
    }

    return downtime;
  }

  /**
   * Ends active downtime and resumes production status.
   * Logs END_DOWNTIME audit action.
   */
  static async endDowntime(params: {
    companyId: string;
    downtimeId: string;
    operatorId: string;
    operatorName: string;
  }): Promise<DowntimeRecord> {
    const { companyId, downtimeId, operatorId, operatorName } = params;

    if (shouldUseProductionApi()) {
      const res = await fetch('/api/downtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          downtime_id: downtimeId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao encerrar parada');
      return json.data;
    }

    const allDowntimes = await repositories.downtime.getAll(companyId);
    const existing = allDowntimes.find((d) => d.id === downtimeId);
    if (!existing || existing.end_time) {
      throw new Error('Registro de parada ativo não encontrado.');
    }

    const endTime = new Date();
    const startTime = new Date(existing.start_time);
    const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));

    const updatedDowntime = await repositories.downtime.update(companyId, downtimeId, {
      end_time: endTime.toISOString(),
      duration_seconds: durationSeconds,
    });

    // Secondary machine status update
    try {
      const activeProd = await repositories.production.getActiveByMachine(companyId, existing.machine_id);
      const nextStatus = activeProd ? 'producing' : 'inactive';
      await repositories.machines.update(companyId, existing.machine_id, { status: nextStatus });
    } catch (err) {
      console.warn('Falha ao atualizar status da máquina ao encerrar parada:', err);
    }

    // Secondary audit log
    try {
      await repositories.audit.create(
        createAuditLogEntry(
          companyId,
          operatorId,
          operatorName,
          'END_DOWNTIME',
          'DOWNTIME_RECORD',
          downtimeId,
          { startTime: existing.start_time },
          { endTime: endTime.toISOString(), durationSeconds }
        )
      );
    } catch (err) {
      console.warn('Falha ao registrar audit log ao encerrar parada:', err);
    }

    return updatedDowntime;
  }

  /**
   * Finalizes production session.
   * Logs END_PRODUCTION audit action.
   */
  static async endProduction(params: {
    companyId: string;
    recordId: string;
    operatorId: string;
    operatorName: string;
  }): Promise<ProductionRecord> {
    const { companyId, recordId, operatorId, operatorName } = params;

    if (shouldUseProductionApi()) {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          record_id: recordId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao finalizar produção');
      return json.data;
    }


    const allRecords = await repositories.production.getAll(companyId);
    const existing = allRecords.find((r) => r.id === recordId);
    if (!existing) {
      throw new Error('Sessão de produção não encontrada.');
    }

    const endTime = new Date().toISOString();
    const updatedRecord = await repositories.production.update(companyId, recordId, {
      end_time: endTime,
    });

    // Secondary machine status update
    try {
      await repositories.machines.update(companyId, existing.machine_id, { status: 'inactive' });
    } catch (err) {
      console.warn('Falha ao atualizar status da máquina ao encerrar produção:', err);
    }

    // Secondary audit log
    try {
      await repositories.audit.create(
        createAuditLogEntry(
          companyId,
          operatorId,
          operatorName,
          'END_PRODUCTION',
          'PRODUCTION_RECORD',
          recordId,
          { startTime: existing.start_time },
          { endTime, totalProduced: existing.produced_quantity }
        )
      );
    } catch (err) {
      console.warn('Falha ao registrar audit log ao encerrar produção:', err);
    }

    return updatedRecord;
  }
}
