import { deriveMachineStatus } from '../lib/machineStatus';
import { ProductionRecord, DowntimeRecord } from '../types';

describe('Machine Status Single Source of Truth Tests', () => {
  it('should derive stopped status when an open downtime record exists', () => {
    const downtime: DowntimeRecord = {
      id: 'dt-1',
      company_id: 'c-1',
      machine_id: 'm-1',
      operator_id: 'u-1',
      order_id: 'o-1',
      reason_id: 'r-1',
      category: 'mechanical',
      start_time: new Date().toISOString(),
      duration_seconds: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const status = deriveMachineStatus(null, downtime);
    expect(status.status).toBe('stopped');
    expect(status.statusBadge).toContain('Parada');
  });

  it('should derive setup status when downtime category is setup', () => {
    const downtime: DowntimeRecord = {
      id: 'dt-1',
      company_id: 'c-1',
      machine_id: 'm-1',
      operator_id: 'u-1',
      order_id: 'o-1',
      reason_id: 'r-1',
      category: 'setup',
      start_time: new Date().toISOString(),
      duration_seconds: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const status = deriveMachineStatus(null, downtime);
    expect(status.status).toBe('setup');
    expect(status.statusBadge).toContain('Setup');
  });

  it('should derive producing status when open production record exists without downtime', () => {
    const production: ProductionRecord = {
      id: 'p-1',
      company_id: 'c-1',
      machine_id: 'm-1',
      operator_id: 'u-1',
      order_id: 'o-1',
      product_id: 'prod-1',
      shift_id: 's-1',
      start_time: new Date().toISOString(),
      produced_quantity: 0,
      rejected_quantity: 0,
      good_quantity: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const status = deriveMachineStatus(production, null);
    expect(status.status).toBe('producing');
    expect(status.statusBadge).toContain('Produzindo');
  });

  it('should derive inactive status when neither active event exists', () => {
    const status = deriveMachineStatus(null, null);
    expect(status.status).toBe('inactive');
    expect(status.statusBadge).toContain('Sem Operação');
  });
});
