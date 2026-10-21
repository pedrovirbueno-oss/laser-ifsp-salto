import { ProductionOrder } from '@/types';

export interface IOrderRepository {
  getAll(companyId: string): Promise<ProductionOrder[]>;
  getById(companyId: string, id: string): Promise<ProductionOrder | null>;
  create(order: Omit<ProductionOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionOrder>;
  update(companyId: string, id: string, updates: Partial<ProductionOrder>): Promise<ProductionOrder>;
  delete(companyId: string, id: string): Promise<boolean>;
}
