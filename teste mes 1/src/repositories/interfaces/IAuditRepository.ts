import { AuditLog } from '@/types';

export interface IAuditRepository {
  getAll(companyId: string): Promise<AuditLog[]>;
  create(log: AuditLog): Promise<AuditLog>;
}
