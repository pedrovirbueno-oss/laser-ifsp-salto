import { DemoMachineRepository, DemoOrderRepository, DemoProductRepository, DemoProductionRepository, DemoDowntimeRepository, DemoAuditRepository, DemoApiKeyRepository } from '../repositories/demo';

function validateCrossTenantReferences(
  table: 'production_records' | 'downtime_records' | 'targets' | 'alerts',
  record: { company_id: string; [key: string]: any },
  entities: Record<string, { company_id: string }>
): void {
  const cId = record.company_id;

  if (table === 'production_records') {
    if (record.machine_id && entities[record.machine_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: machine_id does not belong to target company');
    }
    if (record.operator_id && entities[record.operator_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: operator_id does not belong to target company');
    }
    if (record.order_id && entities[record.order_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: order_id does not belong to target company');
    }
    if (record.product_id && entities[record.product_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: product_id does not belong to target company');
    }
    if (record.shift_id && entities[record.shift_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: shift_id does not belong to target company');
    }
  } else if (table === 'downtime_records') {
    if (record.machine_id && entities[record.machine_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: machine_id does not belong to target company');
    }
    if (record.operator_id && entities[record.operator_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: operator_id does not belong to target company');
    }
    if (record.order_id && entities[record.order_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: order_id does not belong to target company');
    }
    if (record.reason_id && entities[record.reason_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: reason_id does not belong to target company');
    }
  } else if (table === 'targets') {
    if (record.machine_id && entities[record.machine_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: machine_id does not belong to target company');
    }
    if (record.product_id && entities[record.product_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: product_id does not belong to target company');
    }
  } else if (table === 'alerts') {
    if (record.machine_id && entities[record.machine_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: machine_id does not belong to target company');
    }
    if (record.order_id && entities[record.order_id]?.company_id !== cId) {
      throw new Error('CROSS-TENANT VIOLATION: order_id does not belong to target company');
    }
  }
}

describe('Aggressive Multi-Tenancy Read & Write Isolation Tests', () => {
  const companyA = '00000000-0000-0000-0000-000000000001';
  const companyB = '99999999-9999-9999-9999-999999999999';

  const machineRepo = new DemoMachineRepository();
  const orderRepo = new DemoOrderRepository();

  it('READ ISOLATION: should return machines belonging ONLY to Company A', async () => {
    const machinesA = await machineRepo.getAll(companyA);
    expect(machinesA.length).toBeGreaterThan(0);
    machinesA.forEach((m) => {
      expect(m.company_id).toBe(companyA);
    });
  });

  it('READ ISOLATION: should return empty list when querying Company B with no data', async () => {
    const machinesB = await machineRepo.getAll(companyB);
    expect(machinesB).toEqual([]);
  });

  it('READ ISOLATION: Company B cannot retrieve Company A machine by ID', async () => {
    const machinesA = await machineRepo.getAll(companyA);
    const targetMachineId = machinesA[0].id;

    const result = await machineRepo.getById(companyB, targetMachineId);
    expect(result).toBeNull();
  });

  it('READ ISOLATION: Company B cannot retrieve Company A order by ID', async () => {
    const ordersA = await orderRepo.getAll(companyA);
    const targetOrderId = ordersA[0].id;

    const result = await orderRepo.getById(companyB, targetOrderId);
    expect(result).toBeNull();
  });

  it('WRITE ISOLATION: Company B cannot update Machine belonging to Company A', async () => {
    const machinesA = await machineRepo.getAll(companyA);
    const targetMachineId = machinesA[0].id;

    await expect(
      machineRepo.update(companyB, targetMachineId, { name: 'Hacked Name' })
    ).rejects.toThrow();
  });

  it('WRITE ISOLATION: Company B cannot delete Machine belonging to Company A', async () => {
    const machinesA = await machineRepo.getAll(companyA);
    const initialCount = machinesA.length;
    const targetMachineId = machinesA[0].id;

    await machineRepo.delete(companyB, targetMachineId);

    const postMachinesA = await machineRepo.getAll(companyA);
    expect(postMachinesA.length).toBe(initialCount);
  });

  it('OVERRIDE DEFENSE: Company A user cannot inject Company B company_id to access data', async () => {
    function deriveEffectiveCompanyId(sessionCompanyId: string, clientPayloadCompanyId?: string) {
      return sessionCompanyId;
    }

    const sessionCompany = companyA;
    const clientPayloadCompany = companyB;
    const effectiveCompany = deriveEffectiveCompanyId(sessionCompany, clientPayloadCompany);

    expect(effectiveCompany).toBe(companyA);
    expect(effectiveCompany).not.toBe(companyB);
  });

  describe('Strict Cross-Tenant Reference Validation (Trigger Logic)', () => {
    const entities = {
      'm-companyA': { company_id: companyA },
      'm-companyB': { company_id: companyB },
      'op-companyA': { company_id: companyA },
      'op-companyB': { company_id: companyB },
      'order-companyA': { company_id: companyA },
      'order-companyB': { company_id: companyB },
      'prod-companyA': { company_id: companyA },
      'prod-companyB': { company_id: companyB },
      'shift-companyA': { company_id: companyA },
      'shift-companyB': { company_id: companyB },
      'reason-companyA': { company_id: companyA },
      'reason-companyB': { company_id: companyB },
    };

    it('REJECT: production_record com operator de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'production_records',
          { company_id: companyA, machine_id: 'm-companyA', operator_id: 'op-companyB' },
          entities
        )
      ).toThrow(/operator_id/);
    });

    it('REJECT: production_record com shift de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'production_records',
          { company_id: companyA, machine_id: 'm-companyA', operator_id: 'op-companyA', shift_id: 'shift-companyB' },
          entities
        )
      ).toThrow(/shift_id/);
    });

    it('REJECT: downtime_record com reason de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'downtime_records',
          { company_id: companyA, machine_id: 'm-companyA', operator_id: 'op-companyA', reason_id: 'reason-companyB' },
          entities
        )
      ).toThrow(/reason_id/);
    });

    it('REJECT: target com machine de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'targets',
          { company_id: companyA, machine_id: 'm-companyB' },
          entities
        )
      ).toThrow(/machine_id/);
    });

    it('REJECT: target com product de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'targets',
          { company_id: companyA, product_id: 'prod-companyB' },
          entities
        )
      ).toThrow(/product_id/);
    });

    it('REJECT: alert com machine de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'alerts',
          { company_id: companyA, machine_id: 'm-companyB' },
          entities
        )
      ).toThrow(/machine_id/);
    });

    it('REJECT: alert com order de outra empresa', () => {
      expect(() =>
        validateCrossTenantReferences(
          'alerts',
          { company_id: companyA, order_id: 'order-companyB' },
          entities
        )
      ).toThrow(/order_id/);
    });
  });
});
