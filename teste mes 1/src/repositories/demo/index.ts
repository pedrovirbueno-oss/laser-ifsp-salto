import { IMachineRepository } from '../interfaces/IMachineRepository';
import { IOrderRepository } from '../interfaces/IOrderRepository';
import { IProductionRepository } from '../interfaces/IProductionRepository';
import { IDowntimeRepository } from '../interfaces/IDowntimeRepository';
import { IProductRepository } from '../interfaces/IProductRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuditRepository } from '../interfaces/IAuditRepository';
import { IApiKeyRepository } from '../interfaces/IApiKeyRepository';
import { ICompanyRepository } from '../interfaces/ICompanyRepository';

import {
  demoCompany,
  demoProfiles,
  demoMachines,
  demoProducts,
  demoOrders,
  demoProductionRecords,
  demoDowntimeRecords,
  demoDowntimeReasons,
  demoShifts,
  demoAuditLogs,
} from './seedData';

import { Machine, ProductionOrder, ProductionRecord, DowntimeRecord, Product, Profile, AuditLog, ApiKey, Company, Shift, DowntimeReason } from '@/types';

// In-Memory Storage Singletons
let machinesStore: Machine[] = [...demoMachines];
let productsStore: Product[] = [...demoProducts];
let ordersStore: ProductionOrder[] = [...demoOrders];
let productionStore: ProductionRecord[] = [...demoProductionRecords];
let downtimeStore: DowntimeRecord[] = [...demoDowntimeRecords];
let reasonsStore: DowntimeReason[] = [...demoDowntimeReasons];
let shiftsStore: Shift[] = [...demoShifts];
let profilesStore: Profile[] = [...demoProfiles];
let auditStore: AuditLog[] = [...demoAuditLogs];
let apiKeysStore: ApiKey[] = [];
let companyStore: Company = { ...demoCompany };

export class DemoMachineRepository implements IMachineRepository {
  async getAll(companyId: string): Promise<Machine[]> {
    return machinesStore.filter((m) => m.company_id === companyId);
  }
  async getById(companyId: string, id: string): Promise<Machine | null> {
    return machinesStore.find((m) => m.id === id && m.company_id === companyId) || null;
  }
  async getByCode(companyId: string, code: string): Promise<Machine | null> {
    return machinesStore.find((m) => m.code === code && m.company_id === companyId) || null;
  }
  async create(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Promise<Machine> {
    const newMachine: Machine = {
      ...machine,
      id: (machine as any).id || `m-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    machinesStore.push(newMachine);
    return newMachine;
  }
  async update(companyId: string, id: string, updates: Partial<Machine>): Promise<Machine> {
    const idx = machinesStore.findIndex((m) => m.id === id && m.company_id === companyId);
    if (idx === -1) throw new Error('Machine not found');
    machinesStore[idx] = { ...machinesStore[idx], ...updates, updated_at: new Date().toISOString() };
    return machinesStore[idx];
  }
  async delete(companyId: string, id: string): Promise<boolean> {
    machinesStore = machinesStore.filter((m) => !(m.id === id && m.company_id === companyId));
    return true;
  }
}

export class DemoOrderRepository implements IOrderRepository {
  private mapOrder(o: ProductionOrder): ProductionOrder {
    const produced_quantity = Number(o.produced_quantity || 0);
    const rejected_quantity = Number(o.rejected_quantity || 0);
    return {
      ...o,
      produced_quantity,
      rejected_quantity,
      good_quantity: Math.max(0, produced_quantity - rejected_quantity),
    };
  }

  async getAll(companyId: string): Promise<ProductionOrder[]> {
    return ordersStore.filter((o) => o.company_id === companyId).map((o) => this.mapOrder(o));
  }
  async getById(companyId: string, id: string): Promise<ProductionOrder | null> {
    const found = ordersStore.find((o) => o.id === id && o.company_id === companyId);
    return found ? this.mapOrder(found) : null;
  }
  async create(order: Omit<ProductionOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionOrder> {
    const produced_quantity = Number(order.produced_quantity || 0);
    const rejected_quantity = Number(order.rejected_quantity || 0);
    const newOrder: ProductionOrder = {
      ...order,
      id: (order as any).id || `op-${Date.now()}`,
      produced_quantity,
      rejected_quantity,
      good_quantity: Math.max(0, produced_quantity - rejected_quantity),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    ordersStore.push(newOrder);
    return this.mapOrder(newOrder);
  }
  async update(companyId: string, id: string, updates: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const idx = ordersStore.findIndex((o) => o.id === id && o.company_id === companyId);
    if (idx === -1) throw new Error('Order not found');
    ordersStore[idx] = { ...ordersStore[idx], ...updates, updated_at: new Date().toISOString() };
    return this.mapOrder(ordersStore[idx]);
  }
  async delete(companyId: string, id: string): Promise<boolean> {
    ordersStore = ordersStore.filter((o) => !(o.id === id && o.company_id === companyId));
    return true;
  }
}

export class DemoProductionRepository implements IProductionRepository {
  private mapRecord(p: ProductionRecord): ProductionRecord {
    const produced_quantity = Number(p.produced_quantity || 0);
    const rejected_quantity = Number(p.rejected_quantity || 0);
    return {
      ...p,
      produced_quantity,
      rejected_quantity,
      good_quantity: Math.max(0, produced_quantity - rejected_quantity),
    };
  }

  async getAll(companyId: string): Promise<ProductionRecord[]> {
    return productionStore.filter((p) => p.company_id === companyId).map((p) => this.mapRecord(p));
  }
  async getByMachine(companyId: string, machineId: string): Promise<ProductionRecord[]> {
    return productionStore.filter((p) => p.company_id === companyId && p.machine_id === machineId).map((p) => this.mapRecord(p));
  }
  async getActiveByMachine(companyId: string, machineId: string): Promise<ProductionRecord | null> {
    const found = productionStore.find((p) => p.company_id === companyId && p.machine_id === machineId && !p.end_time);
    return found ? this.mapRecord(found) : null;
  }
  async create(record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionRecord> {
    const produced_quantity = Number(record.produced_quantity || 0);
    const rejected_quantity = Number(record.rejected_quantity || 0);
    const newRec: ProductionRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      produced_quantity,
      rejected_quantity,
      good_quantity: Math.max(0, produced_quantity - rejected_quantity),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    productionStore.push(newRec);
    return this.mapRecord(newRec);
  }
  async update(companyId: string, id: string, updates: Partial<ProductionRecord>): Promise<ProductionRecord> {
    const idx = productionStore.findIndex((p) => p.id === id && p.company_id === companyId);
    if (idx === -1) throw new Error('Production record not found');
    productionStore[idx] = { ...productionStore[idx], ...updates, updated_at: new Date().toISOString() };
    return this.mapRecord(productionStore[idx]);
  }
}

export class DemoDowntimeRepository implements IDowntimeRepository {
  async getAll(companyId: string): Promise<DowntimeRecord[]> {
    return downtimeStore.filter((d) => d.company_id === companyId);
  }
  async getByMachine(companyId: string, machineId: string): Promise<DowntimeRecord[]> {
    return downtimeStore.filter((d) => d.company_id === companyId && d.machine_id === machineId);
  }
  async getActiveByMachine(companyId: string, machineId: string): Promise<DowntimeRecord | null> {
    return downtimeStore.find((d) => d.company_id === companyId && d.machine_id === machineId && !d.end_time) || null;
  }
  async create(record: Omit<DowntimeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DowntimeRecord> {
    const newRec: DowntimeRecord = {
      ...record,
      id: `dt-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    downtimeStore.push(newRec);
    return newRec;
  }
  async update(companyId: string, id: string, updates: Partial<DowntimeRecord>): Promise<DowntimeRecord> {
    const idx = downtimeStore.findIndex((d) => d.id === id && d.company_id === companyId);
    if (idx === -1) throw new Error('Downtime record not found');
    downtimeStore[idx] = { ...downtimeStore[idx], ...updates, updated_at: new Date().toISOString() };
    return downtimeStore[idx];
  }
  async getReasons(companyId: string): Promise<DowntimeReason[]> {
    return reasonsStore.filter((r) => r.company_id === companyId);
  }
  async createReason(reason: Omit<DowntimeReason, 'id' | 'created_at'>): Promise<DowntimeReason> {
    const newReason: DowntimeReason = {
      ...reason,
      id: `reason-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    reasonsStore.push(newReason);
    return newReason;
  }
  async toggleReasonActive(companyId: string, id: string, active: boolean): Promise<DowntimeReason> {
    const idx = reasonsStore.findIndex((r) => r.id === id && r.company_id === companyId);
    if (idx === -1) throw new Error('Reason not found');
    reasonsStore[idx].active = active;
    return reasonsStore[idx];
  }
}

export class DemoProductRepository implements IProductRepository {
  async getAll(companyId: string): Promise<Product[]> {
    return productsStore.filter((p) => p.company_id === companyId);
  }
  async getById(companyId: string, id: string): Promise<Product | null> {
    return productsStore.find((p) => p.id === id && p.company_id === companyId) || null;
  }
  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `p-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    productsStore.push(newProduct);
    return newProduct;
  }
  async update(companyId: string, id: string, updates: Partial<Product>): Promise<Product> {
    const idx = productsStore.findIndex((p) => p.id === id && p.company_id === companyId);
    if (idx === -1) throw new Error('Product not found');
    productsStore[idx] = { ...productsStore[idx], ...updates, updated_at: new Date().toISOString() };
    return productsStore[idx];
  }
  async delete(companyId: string, id: string): Promise<boolean> {
    productsStore = productsStore.filter((p) => !(p.id === id && p.company_id === companyId));
    return true;
  }
}

export class DemoUserRepository implements IUserRepository {
  async getAll(companyId: string): Promise<Profile[]> {
    return profilesStore.filter((p) => p.company_id === companyId);
  }
  async getById(id: string): Promise<Profile | null> {
    return profilesStore.find((p) => p.id === id) || null;
  }
  async getByEmail(email: string): Promise<Profile | null> {
    return profilesStore.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  }
  async create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const newProf: Profile = {
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profilesStore.push(newProf);
    return newProf;
  }
  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const idx = profilesStore.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Profile not found');
    profilesStore[idx] = { ...profilesStore[idx], ...updates, updated_at: new Date().toISOString() };
    return profilesStore[idx];
  }
}

export class DemoAuditRepository implements IAuditRepository {
  async getAll(companyId: string): Promise<AuditLog[]> {
    return auditStore.filter((a) => a.company_id === companyId);
  }
  async create(log: AuditLog): Promise<AuditLog> {
    auditStore.unshift(log);
    return log;
  }
}

export class DemoApiKeyRepository implements IApiKeyRepository {
  async getAll(companyId: string): Promise<ApiKey[]> {
    return apiKeysStore.filter((k) => k.company_id === companyId);
  }
  async create(key: Omit<ApiKey, 'id' | 'created_at'>): Promise<ApiKey> {
    const newKey: ApiKey = {
      ...key,
      id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    apiKeysStore.push(newKey);
    return newKey;
  }
  async validateKey(keyHash: string): Promise<ApiKey | null> {
    const found = apiKeysStore.find((k) => k.key_hash === keyHash && k.active);
    if (found) {
      found.last_used_at = new Date().toISOString();
    }
    return found || null;
  }
  async revoke(id: string): Promise<boolean> {
    const key = apiKeysStore.find((k) => k.id === id);
    if (key) {
      key.active = false;
      return true;
    }
    return false;
  }
}

export class DemoCompanyRepository implements ICompanyRepository {
  async getById(id: string): Promise<Company | null> {
    return companyStore.id === id ? companyStore : null;
  }
  async create(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
    companyStore = {
      ...company,
      id: `comp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return companyStore;
  }
  async update(id: string, updates: Partial<Company>): Promise<Company> {
    companyStore = { ...companyStore, ...updates, updated_at: new Date().toISOString() };
    return companyStore;
  }
  async getShifts(companyId: string): Promise<Shift[]> {
    return shiftsStore.filter((s) => s.company_id === companyId);
  }
  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const newShift: Shift = { ...shift, id: `shift-${Date.now()}` };
    shiftsStore.push(newShift);
    return newShift;
  }
  async updateShift(id: string, updates: Partial<Shift>): Promise<Shift> {
    const idx = shiftsStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Shift not found');
    shiftsStore[idx] = { ...shiftsStore[idx], ...updates };
    return shiftsStore[idx];
  }
}
