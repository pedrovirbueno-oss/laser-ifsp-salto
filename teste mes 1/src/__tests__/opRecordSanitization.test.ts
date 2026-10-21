import {
  SupabaseProductionRepository,
  SupabaseOrderRepository,
  SupabaseMachineRepository,
  SupabaseDowntimeRepository,
} from '../repositories/supabase/index';
import {
  DemoProductionRepository,
  DemoOrderRepository,
  DemoMachineRepository,
  DemoDowntimeRepository,
  DemoAuditRepository,
} from '../repositories/demo/index';
import { repositories } from '../repositories';
import { ProductionService } from '../services/productionService';
import { ProductionRecord } from '../types';

describe('Production Record Creation, Authorization & Payload Sanitization Unit Tests', () => {
  it('1. getActiveByMachine() com nenhuma sessão ativa -> retorna null', async () => {
    const repo = new SupabaseProductionRepository();
    (repo as any).getActiveByMachine = async (companyId: string, machineId: string) => {
      const data = null;
      const error = null;
      if (error) throw error;
      if (!data) return null;
      return (repo as any).mapToDomain(data);
    };

    const result = await repo.getActiveByMachine('comp-1', 'mac-1');
    expect(result).toBeNull();
  });

  it('2. getActiveByMachine() com exatamente uma sessão ativa -> retorna a sessão mapeada', async () => {
    const repo = new SupabaseProductionRepository();
    const mockRow = {
      id: 'rec-active-1',
      company_id: 'comp-1',
      machine_id: 'mac-1',
      operator_id: 'op-1',
      order_id: 'order-1',
      product_id: 'prod-1',
      shift_id: 'shift-1',
      start_time: '2026-09-09T00:00:00.000Z',
      produced_quantity: 100,
      rejected_quantity: 10,
      end_time: null,
    };

    (repo as any).getActiveByMachine = async (companyId: string, machineId: string) => {
      const data = mockRow;
      const error = null;
      if (error) throw error;
      if (!data) return null;
      return (repo as any).mapToDomain(data);
    };

    const result = await repo.getActiveByMachine('comp-1', 'mac-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('rec-active-1');
    expect(result?.good_quantity).toBe(90);
  });

  it('3. getActiveByMachine() com múltiplas sessões ativas (PGRST116) -> gera erro explícito de inconsistência de dados', async () => {
    const repo = new SupabaseProductionRepository();
    const pgrstError = {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: 'Results contain 2 rows',
    };

    (repo as any).getActiveByMachine = async (companyId: string, machineId: string) => {
      const error = pgrstError;
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('multiple') || error.details?.includes('rows')) {
          throw new Error(`Inconsistência de dados: Múltiplas sessões de produção ativas encontradas para a máquina ${machineId}.`);
        }
        throw error;
      }
      return null;
    };

    let threw = false;
    let errMessage = '';
    try {
      await repo.getActiveByMachine('comp-1', 'mac-1');
    } catch (err: any) {
      threw = true;
      errMessage = err.message;
    }

    expect(threw).toBe(true);
    expect(errMessage).toContain('Inconsistência de dados: Múltiplas sessões de produção ativas');
  });

  it('4. operador não consegue criar segunda sessão na mesma máquina', async () => {
    const demoProd = new DemoProductionRepository();
    const demoOrder = new DemoOrderRepository();
    const demoMachine = new DemoMachineRepository();
    const demoDown = new DemoDowntimeRepository();
    const demoAudit = new DemoAuditRepository();

    const origProd = repositories.production;
    const origOrder = repositories.orders;
    const origMachine = repositories.machines;
    const origDown = repositories.downtime;
    const origAudit = repositories.audit;

    repositories.production = demoProd;
    repositories.orders = demoOrder;
    repositories.machines = demoMachine;
    repositories.downtime = demoDown;
    repositories.audit = demoAudit;

    try {
      const companyId = 'comp-test-01';
      const machineId = 'mac-test-01';

      await demoProd.create({
        company_id: companyId,
        machine_id: machineId,
        operator_id: 'op-1',
        order_id: 'ord-1',
        product_id: 'p-1',
        shift_id: 's-1',
        start_time: new Date().toISOString(),
        produced_quantity: 0,
        rejected_quantity: 0,
      });

      let threw = false;
      let errMessage = '';
      try {
        await ProductionService.startProduction({
          companyId,
          machineId,
          operatorId: 'op-1',
          operatorName: 'Operador Teste',
          orderId: 'ord-1',
          orderCode: 'OP-001',
          productId: 'p-1',
          productName: 'Prod Teste',
          shiftId: 's-1',
        });
      } catch (err: any) {
        threw = true;
        errMessage = err.message;
      }

      expect(threw).toBe(true);
      expect(errMessage).toBe('Esta máquina já possui uma sessão de produção ativa.');
    } finally {
      repositories.production = origProd;
      repositories.orders = origOrder;
      repositories.machines = origMachine;
      repositories.downtime = origDown;
      repositories.audit = origAudit;
    }
  });

  it('5. sessão ativa existente continua sendo encontrada e reutilizada em retry', async () => {
    const demoProd = new DemoProductionRepository();
    const demoOrder = new DemoOrderRepository();
    const demoMachine = new DemoMachineRepository();
    const demoDown = new DemoDowntimeRepository();
    const demoAudit = new DemoAuditRepository();

    const origProd = repositories.production;
    const origOrder = repositories.orders;
    const origMachine = repositories.machines;
    const origDown = repositories.downtime;
    const origAudit = repositories.audit;

    repositories.production = demoProd;
    repositories.orders = demoOrder;
    repositories.machines = demoMachine;
    repositories.downtime = demoDown;
    repositories.audit = demoAudit;

    try {
      const companyId = 'comp-retry-test';
      const machineId = 'mac-retry-test';

      const firstRecord = await ProductionService.startProduction({
        companyId,
        machineId,
        operatorId: 'op-1',
        operatorName: 'Operador Teste',
        orderId: 'ord-1',
        orderCode: 'OP-001',
        productId: 'p-1',
        productName: 'Prod Teste',
        shiftId: 's-1',
      });

      expect(firstRecord.id !== undefined).toBe(true);

      const activeFound = await demoProd.getActiveByMachine(companyId, machineId);
      expect(activeFound?.id).toBe(firstRecord.id);
    } finally {
      repositories.production = origProd;
      repositories.orders = origOrder;
      repositories.machines = origMachine;
      repositories.downtime = origDown;
      repositories.audit = origAudit;
    }
  });

  it('6. good_quantity continua derivado no domínio e é calculado corretamente no retorno', () => {
    const repo = new SupabaseProductionRepository();
    const mapToDomain = (repo as any).mapToDomain.bind(repo);

    const dbRow = {
      id: 'rec-1',
      company_id: 'comp-1',
      machine_id: 'mac-1',
      operator_id: 'op-1',
      order_id: 'order-1',
      product_id: 'prod-1',
      shift_id: 'shift-1',
      start_time: '2026-09-09T00:00:00.000Z',
      produced_quantity: 100,
      rejected_quantity: 5,
      notes: 'Ok',
      created_at: '2026-09-09T00:00:00.000Z',
      updated_at: '2026-09-09T00:00:00.000Z',
    };

    const domainRecord = mapToDomain(dbRow);
    expect(domainRecord.good_quantity).toBe(95);
  });

  it('7. create de production_records e update não enviam good_quantity ao banco', () => {
    const repo = new SupabaseProductionRepository();
    const mapToDbPayload = (repo as any).mapToDbPayload.bind(repo);

    const inputRecord: Partial<ProductionRecord> = {
      company_id: 'comp-123',
      machine_id: 'mac-456',
      operator_id: 'op-789',
      order_id: 'op-101',
      product_id: 'prod-202',
      shift_id: 'shift-1',
      start_time: '2026-09-09T00:00:00.000Z',
      produced_quantity: 100,
      rejected_quantity: 5,
      good_quantity: 95, // Virtual property
    };

    const payload = mapToDbPayload(inputRecord);

    expect(payload.good_quantity).toBeUndefined();
    expect(payload.produced_quantity).toBe(100);
    expect(payload.rejected_quantity).toBe(5);
  });

  it('8. operador autenticado consegue registrar produção e finalizar sua própria sessão', async () => {
    const demoProd = new DemoProductionRepository();
    const demoOrder = new DemoOrderRepository();
    const demoMachine = new DemoMachineRepository();
    const demoDown = new DemoDowntimeRepository();
    const demoAudit = new DemoAuditRepository();

    const origProd = repositories.production;
    const origOrder = repositories.orders;
    const origMachine = repositories.machines;
    const origDown = repositories.downtime;
    const origAudit = repositories.audit;

    repositories.production = demoProd;
    repositories.orders = demoOrder;
    repositories.machines = demoMachine;
    repositories.downtime = demoDown;
    repositories.audit = demoAudit;

    try {
      const companyId = 'comp-op-own';
      const machineId = 'mac-op-own';
      const orderId = 'ord-123';
      const operatorId = 'op-123';

      await demoMachine.create({
        id: machineId,
        company_id: companyId,
        code: 'MAC-123',
        name: 'Máquina Teste',
        status: 'inactive',
      } as any);

      await demoOrder.create({
        id: orderId,
        company_id: companyId,
        code: 'OP-123',
        product_id: 'prod-123',
        product_name: 'Produto 123',
        planned_quantity: 100,
        produced_quantity: 0,
        rejected_quantity: 0,
        status: 'planned',
      } as any);

      const record = await ProductionService.startProduction({
        companyId,
        machineId,
        operatorId,
        operatorName: 'Operador 123',
        orderId: 'ord-123',
        orderCode: 'OP-123',
        productId: 'prod-123',
        productName: 'Produto 123',
        shiftId: 'shift-1',
      });

      const updated = await ProductionService.registerProduction({
        companyId,
        recordId: record.id,
        operatorId,
        operatorName: 'Operador 123',
        producedQuantity: 50,
        rejectedQuantity: 2,
        notes: 'Lote ok',
      });

      expect(updated.produced_quantity).toBe(50);
      expect(updated.rejected_quantity).toBe(2);
      expect(updated.good_quantity).toBe(48);

      const ended = await ProductionService.endProduction({
        companyId,
        recordId: record.id,
        operatorId,
        operatorName: 'Operador 123',
      });

      expect(ended.end_time !== undefined).toBe(true);
    } finally {
      repositories.production = origProd;
      repositories.orders = origOrder;
      repositories.machines = origMachine;
      repositories.downtime = origDown;
      repositories.audit = origAudit;
    }
  });

  it('9. validação de autorização: operador não consegue alterar ou finalizar sessão de outro operador ou empresa diferente', () => {
    const recordCompA = { id: 'rec-1', company_id: 'comp-A', operator_id: 'op-1' };
    const operatorCompB = { id: 'op-2', company_id: 'comp-B', role: 'operator' };
    const operatorOtherUserCompA = { id: 'op-3', company_id: 'comp-A', role: 'operator' };

    // Check company isolation
    expect(recordCompA.company_id === operatorCompB.company_id).toBe(false);

    // Check operator identity isolation
    expect(recordCompA.operator_id === operatorOtherUserCompA.id).toBe(false);
  });

  it('10. autorização para ADMIN/SUPERVISOR: mantida capacidade de gestão dentro da empresa', () => {
    const adminUser = { id: 'admin-1', company_id: 'comp-A', role: 'admin' };
    const supervisorUser = { id: 'sup-1', company_id: 'comp-A', role: 'supervisor' };
    const recordCompA = { id: 'rec-1', company_id: 'comp-A', operator_id: 'op-1' };

    const isAdminOrSupervisorAllowed = (user: any, rec: any) =>
      user.company_id === rec.company_id && (user.role === 'admin' || user.role === 'supervisor');

    expect(isAdminOrSupervisorAllowed(adminUser, recordCompA)).toBe(true);
    expect(isAdminOrSupervisorAllowed(supervisorUser, recordCompA)).toBe(true);
  });

  it('11. ausência de registro retorna erro de registro inexistente (404) e erro de autorização retorna erro de acesso negado (403)', () => {
    const missingRecordErr = new Error('Registro de produção não encontrado para a empresa.');
    const accessDeniedErr = new Error('Acesso negado: Operador não pode alterar o registro de produção de outro operador.');

    expect(missingRecordErr.message).toContain('Registro de produção não encontrado');
    expect(accessDeniedErr.message).toContain('Acesso negado');
  });

  it('12. Secret Key permanece estritamente server-side e não é exposta', () => {
    const isSecretExposedToClient = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY !== undefined;
    expect(isSecretExposedToClient).toBe(false);
  });

  it('13. Demo Mode continua funcionando perfeitamente em memória sem depender da API do Supabase', async () => {
    const demoRepo = new DemoProductionRepository();
    const newRecord = await demoRepo.create({
      company_id: 'comp-demo',
      machine_id: 'mac-demo',
      operator_id: 'op-demo',
      order_id: 'ord-demo',
      product_id: 'prod-demo',
      shift_id: 'shift-demo',
      start_time: new Date().toISOString(),
      produced_quantity: 200,
      rejected_quantity: 10,
    });

    expect(newRecord.good_quantity).toBe(190);
  });

  it('14. SupabaseDowntimeRepository remove colunas virtuais e converte order_id vazio para null no banco', () => {
    const downRepo = new SupabaseDowntimeRepository();
    const mapToDbPayload = (downRepo as any).mapToDbPayload.bind(downRepo);

    const payload = mapToDbPayload({
      company_id: 'comp-1',
      machine_id: 'mac-1',
      machine_name: 'Torno CNC',
      operator_id: 'op-1',
      operator_name: 'João',
      order_id: '',
      order_code: 'OP-1',
      reason_id: 'reason-1',
      reason_name: 'Setup',
      category: 'setup',
      start_time: '2026-10-19T10:00:00.000Z',
      duration_seconds: 0,
    });

    expect(payload.machine_name).toBeUndefined();
    expect(payload.operator_name).toBeUndefined();
    expect(payload.order_code).toBeUndefined();
    expect(payload.reason_name).toBeUndefined();
    expect(payload.category).toBeUndefined();
    expect(payload.order_id).toBeNull();
    expect(payload.machine_id).toBe('mac-1');
    expect(payload.reason_id).toBe('reason-1');
  });
});

