import { ProductionRecord } from '@/types';

export interface IProductionRepository {
  getAll(companyId: string): Promise<ProductionRecord[]>;
  getByMachine(companyId: string, machineId: string): Promise<ProductionRecord[]>;
  getActiveByMachine(companyId: string, machineId: string): Promise<ProductionRecord | null>;
  create(record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionRecord>;
  update(companyId: string, id: string, updates: Partial<ProductionRecord>): Promise<ProductionRecord>;
}
