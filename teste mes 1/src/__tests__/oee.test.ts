import { calculateOee, calculatePlannedTimeMinutes } from '../lib/oee';
import { ProductionRecord, DowntimeRecord, Product, Shift } from '../types';

describe('OEE Mathematical Engine & Shift Planning Tests', () => {
  const baseProdRecord: ProductionRecord = {
    id: 'rec-1',
    company_id: 'c-1',
    machine_id: 'm-1',
    operator_id: 'u-1',
    order_id: 'o-1',
    product_id: 'p-1',
    shift_id: 's-1',
    start_time: new Date(Date.now() - 3600 * 1000).toISOString(),
    end_time: new Date().toISOString(),
    produced_quantity: 100,
    rejected_quantity: 5,
    good_quantity: 95,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('should return sufficientData: false when planned time is 0 or records are empty', () => {
    const result = calculateOee([], [], 0);
    expect(result.sufficientData).toBe(false);
    expect(result.oee).toBe(0);
  });

  it('OEE: produto sem target -> sufficientData=false', () => {
    const result = calculateOee([baseProdRecord], [], 60, {});
    expect(result.sufficientData).toBe(false);
    expect(result.performance).toBe(0);
    expect(result.oee).toBe(0);
  });

  it('OEE: produto sem cycle time nem target quantity/hour -> sufficientData=false', () => {
    const incompleteProductMap: Record<string, Product> = {
      'p-1': {
        id: 'p-1',
        company_id: 'c-1',
        name: 'Produto Incompleto',
        code: 'P-INC',
        description: '',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const result = calculateOee([baseProdRecord], [], 60, incompleteProductMap);
    expect(result.sufficientData).toBe(false);
    expect(result.performance).toBe(0);
  });

  it('OEE: produto sem cycle time (mas com target quantity/hour) calcula performance corretamente', () => {
    const productWithRateOnlyMap: Record<string, Product> = {
      'p-1': {
        id: 'p-1',
        company_id: 'c-1',
        name: 'Produto Com Meta Por Hora',
        code: 'P-RATE',
        description: '',
        target_quantity_per_hour: 100,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const result = calculateOee([baseProdRecord], [], 60, productWithRateOnlyMap);
    expect(result.sufficientData).toBe(true);
    expect(result.performance).toBe(100);
  });

  it('OEE: produto sem target quantity/hour (mas com cycle time) calcula performance via cycle time', () => {
    const productWithCycleOnlyMap: Record<string, Product> = {
      'p-1': {
        id: 'p-1',
        company_id: 'c-1',
        name: 'Produto Com Cycle Time',
        code: 'P-CYCLE',
        description: '',
        target_cycle_time_seconds: 36, // 36s = 100 pçs/h
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const result = calculateOee([baseProdRecord], [], 60, productWithCycleOnlyMap);
    expect(result.sufficientData).toBe(true);
    expect(result.performance).toBe(100);
  });

  it('OEE: NENHUM fallback artificial de 60 pçs/h é usado para produto sem configuração', () => {
    const unconfiguredProductMap: Record<string, Product> = {
      'p-1': {
        id: 'p-1',
        company_id: 'c-1',
        name: 'Produto Sem Meta',
        code: 'P-NONE',
        description: '',
        target_cycle_time_seconds: undefined,
        target_quantity_per_hour: undefined,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const result = calculateOee([baseProdRecord], [], 60, unconfiguredProductMap);
    expect(result.sufficientData).toBe(false);
    expect(result.performance).toBe(0);
  });

  it('should calculate Availability, Performance, Quality and OEE correctly with valid targets', () => {
    const downtimeRecords: DowntimeRecord[] = [
      {
        id: 'dt-1',
        company_id: 'c-1',
        machine_id: 'm-1',
        operator_id: 'u-1',
        order_id: 'o-1',
        reason_id: 'r-1',
        start_time: new Date().toISOString(),
        duration_seconds: 600, // 10 minutes downtime
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const targetProductsMap: Record<string, Product> = {
      'p-1': {
        id: 'p-1',
        company_id: 'c-1',
        name: 'Produto Teste',
        code: 'P-100',
        description: '',
        target_cycle_time_seconds: 36,
        target_quantity_per_hour: 100,
        target_scrap_percentage: 2,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const result = calculateOee([baseProdRecord], downtimeRecords, 60, targetProductsMap);

    expect(result.sufficientData).toBe(true);
    expect(result.downtimeMinutes).toBe(10);
    expect(result.runTimeMinutes).toBe(50);
    expect(result.availability).toBe(83.3);
    expect(result.quality).toBe(95);
    expect(result.oee).toBeGreaterThan(0);
    expect(result.oee).toBeLessThanOrEqual(100);
  });

  it('should compute planned time correctly taking into account overnight shifts', () => {
    const shifts: Shift[] = [
      { id: 's1', company_id: 'c1', name: 'Turno Noturno C', start_time: '22:00', end_time: '06:00', active: true },
    ];

    const startDate = new Date('2026-09-01T00:00:00Z');
    const endDate = new Date('2026-09-02T00:00:00Z');

    const plannedMinutes = calculatePlannedTimeMinutes(startDate, endDate, shifts);
    expect(plannedMinutes).toBe(480);
  });
});
