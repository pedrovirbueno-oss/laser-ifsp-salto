import { Machine } from '@/types';

export interface IMachineRepository {
  getAll(companyId: string): Promise<Machine[]>;
  getById(companyId: string, id: string): Promise<Machine | null>;
  getByCode(companyId: string, code: string): Promise<Machine | null>;
  create(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Promise<Machine>;
  update(companyId: string, id: string, updates: Partial<Machine>): Promise<Machine>;
  delete(companyId: string, id: string): Promise<boolean>;
}
