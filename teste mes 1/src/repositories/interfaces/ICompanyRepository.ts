import { Company, Shift } from '@/types';

export interface ICompanyRepository {
  getById(id: string): Promise<Company | null>;
  create(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company>;
  update(id: string, updates: Partial<Company>): Promise<Company>;
  getShifts(companyId: string): Promise<Shift[]>;
  createShift(shift: Omit<Shift, 'id'>): Promise<Shift>;
  updateShift(id: string, updates: Partial<Shift>): Promise<Shift>;
}
