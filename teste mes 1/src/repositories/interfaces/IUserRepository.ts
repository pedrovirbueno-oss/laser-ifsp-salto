import { Profile } from '@/types';

export interface IUserRepository {
  getAll(companyId: string): Promise<Profile[]>;
  getById(id: string): Promise<Profile | null>;
  getByEmail(email: string): Promise<Profile | null>;
  create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile>;
  update(id: string, updates: Partial<Profile>): Promise<Profile>;
}
