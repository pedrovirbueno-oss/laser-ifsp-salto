import { DowntimeRecord, DowntimeReason } from '@/types';

export interface IDowntimeRepository {
  getAll(companyId: string): Promise<DowntimeRecord[]>;
  getByMachine(companyId: string, machineId: string): Promise<DowntimeRecord[]>;
  getActiveByMachine(companyId: string, machineId: string): Promise<DowntimeRecord | null>;
  create(record: Omit<DowntimeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DowntimeRecord>;
  update(companyId: string, id: string, updates: Partial<DowntimeRecord>): Promise<DowntimeRecord>;
  getReasons(companyId: string): Promise<DowntimeReason[]>;
  createReason(reason: Omit<DowntimeReason, 'id' | 'created_at'>): Promise<DowntimeReason>;
  toggleReasonActive(companyId: string, id: string, active: boolean): Promise<DowntimeReason>;
}
