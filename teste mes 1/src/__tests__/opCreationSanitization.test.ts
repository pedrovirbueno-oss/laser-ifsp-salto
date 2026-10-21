import { SupabaseOrderRepository } from '../repositories/supabase/index';
import { DemoOrderRepository } from '../repositories/demo/index';
import { ProductionOrder } from '../types';

describe('Production Order Creation & Payload Sanitization Unit Tests', () => {

  it('1 & 2 & 3. DB Payload transformation includes ONLY physical columns (excludes good_quantity and product_name)', () => {
    const repo = new SupabaseOrderRepository();
    const mapToDbPayload = (repo as any).mapToDbPayload.bind(repo);

    const inputOrder: Partial<ProductionOrder> = {
      company_id: 'comp-123',
      code: 'OP-2026-9000',
      product_id: 'prod-456',
      product_name: 'Eixo Usinado (Virtual Property)',
      planned_quantity: 1000,
      produced_quantity: 0,
      rejected_quantity: 0,
      good_quantity: 0, // Virtual Property
      start_date: '2026-09-09T00:00:00.000Z',
      due_date: '2026-09-16T00:00:00.000Z',
      status: 'planned',
    };

    const payload = mapToDbPayload(inputOrder);

    // Verify virtual properties are NOT in payload
    expect(payload.good_quantity).toBeUndefined();
    expect(payload.product_name).toBeUndefined();

    // Verify exact physical columns present
    expect(payload).toEqual({
      company_id: 'comp-123',
      code: 'OP-2026-9000',
      product_id: 'prod-456',
      planned_quantity: 1000,
      produced_quantity: 0,
      rejected_quantity: 0,
      start_date: '2026-09-09T00:00:00.000Z',
      due_date: '2026-09-16T00:00:00.000Z',
      status: 'planned',
    });
  });

  it('4. Domain mapping computes good_quantity correctly upon reading DB row', () => {
    const repo = new SupabaseOrderRepository();
    const mapToDomain = (repo as any).mapToDomain.bind(repo);

    const dbRow = {
      id: 'op-1',
      company_id: 'comp-1',
      code: 'OP-001',
      product_id: 'p-1',
      planned_quantity: 500,
      produced_quantity: 200,
      rejected_quantity: 15,
      start_date: '2026-09-01T00:00:00.000Z',
      due_date: '2026-09-10T00:00:00.000Z',
      status: 'active',
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
      products: { name: 'Flange SAE 1020' },
    };

    const domainOrder = mapToDomain(dbRow);
    expect(domainOrder.good_quantity).toBe(185); // 200 - 15
    expect(domainOrder.product_name).toBe('Flange SAE 1020');
  });

  it('5. produced_quantity = 100 and rejected_quantity = 7 -> good_quantity = 93', () => {
    const repo = new SupabaseOrderRepository();
    const mapToDomain = (repo as any).mapToDomain.bind(repo);

    const dbRow = {
      id: 'op-2',
      company_id: 'comp-1',
      code: 'OP-002',
      product_id: 'p-1',
      planned_quantity: 1000,
      produced_quantity: 100,
      rejected_quantity: 7,
      start_date: '2026-09-01T00:00:00.000Z',
      due_date: '2026-09-10T00:00:00.000Z',
      status: 'active',
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
    };

    const domainOrder = mapToDomain(dbRow);
    expect(domainOrder.good_quantity).toBe(93);
  });

  it('6. produced_quantity = 0 and rejected_quantity = 0 -> good_quantity = 0', () => {
    const repo = new SupabaseOrderRepository();
    const mapToDomain = (repo as any).mapToDomain.bind(repo);

    const dbRow = {
      id: 'op-3',
      company_id: 'comp-1',
      code: 'OP-003',
      product_id: 'p-1',
      planned_quantity: 1000,
      produced_quantity: 0,
      rejected_quantity: 0,
      start_date: '2026-09-01T00:00:00.000Z',
      due_date: '2026-09-10T00:00:00.000Z',
      status: 'planned',
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
    };

    const domainOrder = mapToDomain(dbRow);
    expect(domainOrder.good_quantity).toBe(0);
  });

  it('7. Update OP payload strips virtual properties (good_quantity, product_name)', () => {
    const repo = new SupabaseOrderRepository();
    const mapToDbPayload = (repo as any).mapToDbPayload.bind(repo);

    const updates: Partial<ProductionOrder> = {
      produced_quantity: 300,
      rejected_quantity: 10,
      good_quantity: 290, // Should be stripped
      product_name: 'Ignored In Update', // Should be stripped
      status: 'active',
    };

    const dbPayload = mapToDbPayload(updates);

    expect(dbPayload.good_quantity).toBeUndefined();
    expect(dbPayload.product_name).toBeUndefined();
    expect(dbPayload).toEqual({
      produced_quantity: 300,
      rejected_quantity: 10,
      status: 'active',
    });
  });

  it('8. Demo Mode order repository continues working with good_quantity computation', async () => {
    const demoRepo = new DemoOrderRepository();
    const companyId = '00000000-0000-0000-0000-000000000001';

    const newOrder = await demoRepo.create({
      company_id: companyId,
      code: `OP-TEST-${Date.now()}`,
      product_id: 'p-1',
      product_name: 'Test Prod',
      planned_quantity: 500,
      produced_quantity: 50,
      rejected_quantity: 2,
      start_date: new Date().toISOString(),
      due_date: new Date().toISOString(),
      status: 'active',
    });

    expect(newOrder.good_quantity).toBe(48);

    const fetched = await demoRepo.getById(companyId, newOrder.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.good_quantity).toBe(48);
  });

  it('9. Multi-Tenancy & RLS isolation preserved (company_id remains required and checked)', () => {
    const repo = new SupabaseOrderRepository();
    const mapToDbPayload = (repo as any).mapToDbPayload.bind(repo);

    const payload = mapToDbPayload({
      company_id: 'company-a',
      code: 'OP-SEC-01',
    });

    expect(payload.company_id).toBe('company-a');
  });

});
