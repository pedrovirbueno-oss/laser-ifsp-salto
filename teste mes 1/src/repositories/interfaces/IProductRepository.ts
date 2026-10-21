import { Product } from '@/types';

export interface IProductRepository {
  getAll(companyId: string): Promise<Product[]>;
  getById(companyId: string, id: string): Promise<Product | null>;
  create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product>;
  update(companyId: string, id: string, updates: Partial<Product>): Promise<Product>;
  delete(companyId: string, id: string): Promise<boolean>;
}
