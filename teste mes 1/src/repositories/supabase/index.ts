import { IMachineRepository } from '../interfaces/IMachineRepository';
import { IOrderRepository } from '../interfaces/IOrderRepository';
import { IProductionRepository } from '../interfaces/IProductionRepository';
import { IDowntimeRepository } from '../interfaces/IDowntimeRepository';
import { IProductRepository } from '../interfaces/IProductRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuditRepository } from '../interfaces/IAuditRepository';
import { IApiKeyRepository } from '../interfaces/IApiKeyRepository';
import { ICompanyRepository } from '../interfaces/ICompanyRepository';

import { createClient } from '@/lib/supabase/client';
import { Machine, ProductionOrder, ProductionRecord, DowntimeRecord, Product, Profile, AuditLog, ApiKey, Company, Shift, DowntimeReason } from '@/types';

export class SupabaseMachineRepository implements IMachineRepository {
  async getAll(companyId: string): Promise<Machine[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('machines').select('*').eq('company_id', companyId);
    if (error) throw error;
    return data as Machine[];
  }
  async getById(companyId: string, id: string): Promise<Machine | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('machines').select('*').eq('id', id).eq('company_id', companyId).maybeSingle();
    if (error || !data) return null;
    return data as Machine;
  }
  async getByCode(companyId: string, code: string): Promise<Machine | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('machines').select('*').eq('code', code).eq('company_id', companyId).maybeSingle();
    if (error || !data) return null;
    return data as Machine;
  }
  async create(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Promise<Machine> {
    const supabase = createClient();
    const { data, error } = await supabase.from('machines').insert(machine).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar máquina.');
    return data as Machine;
  }
  async update(companyId: string, id: string, updates: Partial<Machine>): Promise<Machine> {
    const supabase = createClient();
    const { data, error } = await supabase.from('machines').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', companyId).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Máquina ${id} não encontrada para a empresa ${companyId}.`);
    return data as Machine;
  }
  async delete(companyId: string, id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('machines').delete().eq('id', id).eq('company_id', companyId);
    return !error;
  }
}

export class SupabaseOrderRepository implements IOrderRepository {
  private mapToDomain(row: any): ProductionOrder {
    const produced_quantity = Number(row.produced_quantity || 0);
    const rejected_quantity = Number(row.rejected_quantity || 0);
    const good_quantity = Math.max(0, produced_quantity - rejected_quantity);
    const productName = row.product_name || row.products?.name || '';

    return {
      id: row.id,
      company_id: row.company_id,
      code: row.code,
      product_id: row.product_id,
      product_name: productName,
      planned_quantity: Number(row.planned_quantity || 0),
      produced_quantity,
      rejected_quantity,
      good_quantity,
      start_date: row.start_date,
      due_date: row.due_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapToDbPayload(order: Partial<ProductionOrder>) {
    const payload: Record<string, any> = {};

    if (order.company_id !== undefined) payload.company_id = order.company_id;
    if (order.code !== undefined) payload.code = order.code;
    if (order.product_id !== undefined) payload.product_id = order.product_id;
    if (order.planned_quantity !== undefined) payload.planned_quantity = order.planned_quantity;
    if (order.produced_quantity !== undefined) payload.produced_quantity = order.produced_quantity;
    if (order.rejected_quantity !== undefined) payload.rejected_quantity = order.rejected_quantity;
    if (order.start_date !== undefined) payload.start_date = order.start_date;
    if (order.due_date !== undefined) payload.due_date = order.due_date;
    if (order.status !== undefined) payload.status = order.status;

    return payload;
  }

  async getAll(companyId: string): Promise<ProductionOrder[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('production_orders').select('*, products(name)').eq('company_id', companyId);
    if (error) throw error;
    return (data || []).map((row) => this.mapToDomain(row));
  }

  async getById(companyId: string, id: string): Promise<ProductionOrder | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('production_orders').select('*, products(name)').eq('id', id).eq('company_id', companyId).maybeSingle();
    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async create(order: Omit<ProductionOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionOrder> {
    const supabase = createClient();
    const dbPayload = this.mapToDbPayload(order);
    const { data, error } = await supabase.from('production_orders').insert(dbPayload).select('*, products(name)').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar ordem de produção.');
    return this.mapToDomain({ ...data, product_name: order.product_name || data.products?.name });
  }

  async update(companyId: string, id: string, updates: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const supabase = createClient();
    const dbPayload = {
      ...this.mapToDbPayload(updates),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('production_orders')
      .update(dbPayload)
      .eq('id', id)
      .eq('company_id', companyId)
      .select('*, products(name)')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Ordem de produção ${id} não encontrada para a empresa ${companyId}.`);
    return this.mapToDomain({ ...data, product_name: updates.product_name || data.products?.name });
  }

  async delete(companyId: string, id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('production_orders').delete().eq('id', id).eq('company_id', companyId);
    return !error;
  }
}

export class SupabaseProductionRepository implements IProductionRepository {
  private mapToDomain(row: any): ProductionRecord {
    const produced_quantity = Number(row.produced_quantity || 0);
    const rejected_quantity = Number(row.rejected_quantity || 0);
    const good_quantity = Math.max(0, produced_quantity - rejected_quantity);

    return {
      id: row.id,
      company_id: row.company_id,
      machine_id: row.machine_id,
      machine_name: row.machine_name || row.machines?.name,
      operator_id: row.operator_id,
      operator_name: row.operator_name || row.profiles?.name,
      order_id: row.order_id,
      order_code: row.order_code || row.production_orders?.code,
      product_id: row.product_id,
      product_name: row.product_name || row.products?.name,
      shift_id: row.shift_id,
      shift_name: row.shift_name || row.shifts?.name,
      start_time: row.start_time,
      end_time: row.end_time || undefined,
      produced_quantity,
      rejected_quantity,
      good_quantity,
      notes: row.notes || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapToDbPayload(record: Partial<ProductionRecord>) {
    const payload: Record<string, any> = {};

    if (record.company_id !== undefined) payload.company_id = record.company_id;
    if (record.machine_id !== undefined) payload.machine_id = record.machine_id;
    if (record.operator_id !== undefined) payload.operator_id = record.operator_id;
    if (record.order_id !== undefined) payload.order_id = record.order_id;
    if (record.product_id !== undefined) payload.product_id = record.product_id;
    if (record.shift_id !== undefined) payload.shift_id = record.shift_id;
    if (record.start_time !== undefined) payload.start_time = record.start_time;
    if (record.end_time !== undefined) payload.end_time = record.end_time;
    if (record.produced_quantity !== undefined) payload.produced_quantity = record.produced_quantity;
    if (record.rejected_quantity !== undefined) payload.rejected_quantity = record.rejected_quantity;
    if (record.notes !== undefined) payload.notes = record.notes;

    return payload;
  }

  async getAll(companyId: string): Promise<ProductionRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_records')
      .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
      .eq('company_id', companyId);
    if (error) throw error;
    return (data || []).map((row) => this.mapToDomain(row));
  }

  async getByMachine(companyId: string, machineId: string): Promise<ProductionRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_records')
      .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
      .eq('company_id', companyId)
      .eq('machine_id', machineId);
    if (error) throw error;
    return (data || []).map((row) => this.mapToDomain(row));
  }

  async getActiveByMachine(companyId: string, machineId: string): Promise<ProductionRecord | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_records')
      .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
      .eq('company_id', companyId)
      .eq('machine_id', machineId)
      .is('end_time', null)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('multiple') || error.details?.includes('rows')) {
        throw new Error(`Inconsistência de dados: Múltiplas sessões de produção ativas encontradas para a máquina ${machineId}.`);
      }
      throw error;
    }

    if (!data) return null;
    return this.mapToDomain(data);
  }

  async create(record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionRecord> {
    const supabase = createClient();
    const dbPayload = this.mapToDbPayload(record);
    const { data, error } = await supabase.from('production_records').insert(dbPayload).select().maybeSingle();

    if (error) throw error;

    if (data) {
      return this.mapToDomain(data);
    }

    // Fallback: Check if session was created in DB despite select returning null
    const active = await this.getActiveByMachine(record.company_id, record.machine_id);
    if (active) {
      return active;
    }

    throw new Error('Falha ao criar registro de produção.');
  }

  async update(companyId: string, id: string, updates: Partial<ProductionRecord>): Promise<ProductionRecord> {
    const supabase = createClient();
    const dbPayload = {
      ...this.mapToDbPayload(updates),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('production_records').update(dbPayload).eq('id', id).eq('company_id', companyId).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Registro de produção ${id} não encontrado para a empresa ${companyId}.`);
    return this.mapToDomain(data);
  }
}

export class SupabaseDowntimeRepository implements IDowntimeRepository {
  private mapToDomain(row: any): DowntimeRecord {
    return {
      id: row.id,
      company_id: row.company_id,
      machine_id: row.machine_id,
      machine_name: row.machine_name || row.machines?.name,
      operator_id: row.operator_id,
      operator_name: row.operator_name || row.profiles?.name,
      order_id: row.order_id || undefined,
      order_code: row.order_code || row.production_orders?.code,
      reason_id: row.reason_id,
      reason_name: row.reason_name || row.downtime_reasons?.name,
      category: row.category || row.downtime_reasons?.category,
      start_time: row.start_time,
      end_time: row.end_time || undefined,
      duration_seconds: Number(row.duration_seconds || 0),
      notes: row.notes || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapToDbPayload(record: Partial<DowntimeRecord>) {
    const payload: Record<string, any> = {};

    if (record.company_id !== undefined) payload.company_id = record.company_id;
    if (record.machine_id !== undefined) payload.machine_id = record.machine_id;
    if (record.operator_id !== undefined) payload.operator_id = record.operator_id;
    if (record.order_id !== undefined) payload.order_id = record.order_id || null;
    if (record.reason_id !== undefined) payload.reason_id = record.reason_id;
    if (record.start_time !== undefined) payload.start_time = record.start_time;
    if (record.end_time !== undefined) payload.end_time = record.end_time;
    if (record.duration_seconds !== undefined) payload.duration_seconds = record.duration_seconds;
    if (record.notes !== undefined) payload.notes = record.notes;

    return payload;
  }

  async getAll(companyId: string): Promise<DowntimeRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('downtime_records')
      .select('*, machines(name), profiles(name), production_orders(code), downtime_reasons(name, category)')
      .eq('company_id', companyId);
    if (error) throw error;
    return (data || []).map((r) => this.mapToDomain(r));
  }
  async getByMachine(companyId: string, machineId: string): Promise<DowntimeRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('downtime_records')
      .select('*, machines(name), profiles(name), production_orders(code), downtime_reasons(name, category)')
      .eq('company_id', companyId)
      .eq('machine_id', machineId);
    if (error) throw error;
    return (data || []).map((r) => this.mapToDomain(r));
  }
  async getActiveByMachine(companyId: string, machineId: string): Promise<DowntimeRecord | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('downtime_records')
      .select('*, machines(name), profiles(name), production_orders(code), downtime_reasons(name, category)')
      .eq('company_id', companyId)
      .eq('machine_id', machineId)
      .is('end_time', null)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('multiple') || error.details?.includes('rows')) {
        throw new Error(`Inconsistência de dados: Múltiplas paradas ativas encontradas para a máquina ${machineId}.`);
      }
      throw error;
    }
    if (!data) return null;
    return this.mapToDomain(data);
  }
  async create(record: Omit<DowntimeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DowntimeRecord> {
    const supabase = createClient();
    const dbPayload = this.mapToDbPayload(record);
    const { data, error } = await supabase.from('downtime_records').insert(dbPayload).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar registro de parada.');
    return this.mapToDomain({ ...record, ...data });
  }
  async update(companyId: string, id: string, updates: Partial<DowntimeRecord>): Promise<DowntimeRecord> {
    const supabase = createClient();
    const dbPayload = {
      ...this.mapToDbPayload(updates),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('downtime_records').update(dbPayload).eq('id', id).eq('company_id', companyId).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Registro de parada ${id} não encontrado para a empresa ${companyId}.`);
    return this.mapToDomain(data);
  }
  async getReasons(companyId: string): Promise<DowntimeReason[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('downtime_reasons').select('*').eq('company_id', companyId);
    if (error) throw error;
    return data as DowntimeReason[];
  }
  async createReason(reason: Omit<DowntimeReason, 'id' | 'created_at'>): Promise<DowntimeReason> {
    const supabase = createClient();
    const { data, error } = await supabase.from('downtime_reasons').insert(reason).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar motivo de parada.');
    return data as DowntimeReason;
  }
  async toggleReasonActive(companyId: string, id: string, active: boolean): Promise<DowntimeReason> {
    const supabase = createClient();
    const { data, error } = await supabase.from('downtime_reasons').update({ active }).eq('id', id).eq('company_id', companyId).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Motivo de parada ${id} não encontrado para a empresa ${companyId}.`);
    return data as DowntimeReason;
  }
}

export class SupabaseProductRepository implements IProductRepository {
  async getAll(companyId: string): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('products').select('*').eq('company_id', companyId);
    if (error) throw error;
    return data as Product[];
  }
  async getById(companyId: string, id: string): Promise<Product | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('products').select('*').eq('id', id).eq('company_id', companyId).maybeSingle();
    if (error || !data) return null;
    return data as Product;
  }
  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase.from('products').insert(product).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar produto.');
    return data as Product;
  }
  async update(companyId: string, id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', companyId).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Produto ${id} não encontrado para a empresa ${companyId}.`);
    return data as Product;
  }
  async delete(companyId: string, id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id).eq('company_id', companyId);
    return !error;
  }
}

export class SupabaseUserRepository implements IUserRepository {
  async getAll(companyId: string): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('company_id', companyId);
    if (error) throw error;
    return data as Profile[];
  }
  async getById(id: string): Promise<Profile | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  }
  async getByEmail(email: string): Promise<Profile | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  }
  async create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').insert(profile).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar perfil de usuário.');
    return data as Profile;
  }
  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Perfil ${id} não encontrado.`);
    return data as Profile;
  }
}

export class SupabaseAuditRepository implements IAuditRepository {
  async getAll(companyId: string): Promise<AuditLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('audit_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as AuditLog[];
  }
  async create(log: AuditLog): Promise<AuditLog> {
    if (typeof window === 'undefined') {
      const { createClient: createSupabaseDirect } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-unconfigured.supabase.co';
      const secretKey = process.env.SUPABASE_SECRET_KEY || 'demo-secret-key';
      const supabaseAdmin = createSupabaseDirect(supabaseUrl, secretKey);
      const { data, error } = await supabaseAdmin.from('audit_logs').insert(log).select().maybeSingle();
      if (error) throw error;
      if (!data) return log;
      return data as AuditLog;
    }
    const supabase = createClient();
    const { data, error } = await supabase.from('audit_logs').insert(log).select().maybeSingle();
    if (error) throw error;
    if (!data) return log;
    return data as AuditLog;
  }
}

export class SupabaseApiKeyRepository implements IApiKeyRepository {
  async getAll(companyId: string): Promise<ApiKey[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('api_keys').select('id, company_id, name, active, created_at, last_used_at').eq('company_id', companyId);
    if (error) throw error;
    return data as ApiKey[];
  }
  async create(key: Omit<ApiKey, 'id' | 'created_at'>): Promise<ApiKey> {
    const supabase = createClient();
    const { data, error } = await supabase.from('api_keys').insert(key).select('id, company_id, name, active, created_at, last_used_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar chave de API.');
    return data as ApiKey;
  }
  async validateKey(keyHash: string): Promise<ApiKey | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('api_keys').select('*').eq('key_hash', keyHash).eq('active', true).maybeSingle();
    if (error || !data) return null;
    return data as ApiKey;
  }
  async revoke(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('api_keys').update({ active: false }).eq('id', id);
    return !error;
  }
}

export class SupabaseCompanyRepository implements ICompanyRepository {
  async getById(id: string): Promise<Company | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data as Company;
  }
  async create(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
    const supabase = createClient();
    const { data, error } = await supabase.from('companies').insert(company).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar empresa.');
    return data as Company;
  }
  async update(id: string, updates: Partial<Company>): Promise<Company> {
    const supabase = createClient();
    const { data, error } = await supabase.from('companies').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Empresa ${id} não encontrada.`);
    return data as Company;
  }
  async getShifts(companyId: string): Promise<Shift[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('shifts').select('*').eq('company_id', companyId);
    if (error) throw error;
    return data as Shift[];
  }
  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const supabase = createClient();
    const { data, error } = await supabase.from('shifts').insert(shift).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Falha ao criar turno.');
    return data as Shift;
  }
  async updateShift(id: string, updates: Partial<Shift>): Promise<Shift> {
    const supabase = createClient();
    const { data, error } = await supabase.from('shifts').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Turno ${id} não encontrado.`);
    return data as Shift;
  }
}

