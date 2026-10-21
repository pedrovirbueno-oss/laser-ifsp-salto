import { ApiKey } from '@/types';

export interface IApiKeyRepository {
  getAll(companyId: string): Promise<ApiKey[]>;
  create(key: Omit<ApiKey, 'id' | 'created_at'>): Promise<ApiKey>;
  validateKey(keyHash: string): Promise<ApiKey | null>;
  revoke(id: string): Promise<boolean>;
}
