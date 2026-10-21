import { IMachineRepository } from './interfaces/IMachineRepository';
import { IOrderRepository } from './interfaces/IOrderRepository';
import { IProductionRepository } from './interfaces/IProductionRepository';
import { IDowntimeRepository } from './interfaces/IDowntimeRepository';
import { IProductRepository } from './interfaces/IProductRepository';
import { IUserRepository } from './interfaces/IUserRepository';
import { IAuditRepository } from './interfaces/IAuditRepository';
import { IApiKeyRepository } from './interfaces/IApiKeyRepository';
import { ICompanyRepository } from './interfaces/ICompanyRepository';

import {
  DemoMachineRepository,
  DemoOrderRepository,
  DemoProductionRepository,
  DemoDowntimeRepository,
  DemoProductRepository,
  DemoUserRepository,
  DemoAuditRepository,
  DemoApiKeyRepository,
  DemoCompanyRepository,
} from './demo';

import {
  SupabaseMachineRepository,
  SupabaseOrderRepository,
  SupabaseProductionRepository,
  SupabaseDowntimeRepository,
  SupabaseProductRepository,
  SupabaseUserRepository,
  SupabaseAuditRepository,
  SupabaseApiKeyRepository,
  SupabaseCompanyRepository,
} from './supabase';

export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

export interface RepositoryFactory {
  machines: IMachineRepository;
  orders: IOrderRepository;
  production: IProductionRepository;
  downtime: IDowntimeRepository;
  products: IProductRepository;
  users: IUserRepository;
  audit: IAuditRepository;
  apiKeys: IApiKeyRepository;
  company: ICompanyRepository;
}

export const demoRepositories: RepositoryFactory = {
  machines: new DemoMachineRepository(),
  orders: new DemoOrderRepository(),
  production: new DemoProductionRepository(),
  downtime: new DemoDowntimeRepository(),
  products: new DemoProductRepository(),
  users: new DemoUserRepository(),
  audit: new DemoAuditRepository(),
  apiKeys: new DemoApiKeyRepository(),
  company: new DemoCompanyRepository(),
};

export function isTestUserSessionActive(): boolean {
  if (IS_DEMO_MODE) return true;
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    try {
      if (window.sessionStorage.getItem('nexo_test_mode') === 'true') return true;
      if (document.cookie.includes('nexo_test_session=')) return true;
    } catch {
      // Ignore storage errors
    }
  }
  return false;
}

export function setTestUserSessionActive(active: boolean, role: string = 'admin') {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    try {
      if (active) {
        window.sessionStorage.setItem('nexo_test_mode', 'true');
        window.sessionStorage.setItem('nexo_test_role', role);
        document.cookie = `nexo_test_session=${encodeURIComponent(role)}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        window.sessionStorage.removeItem('nexo_test_mode');
        window.sessionStorage.removeItem('nexo_test_role');
        document.cookie = 'nexo_test_session=; path=/; max-age=0; SameSite=Lax';
      }
    } catch {
      // Ignore storage errors
    }
  }
}

function isNetworkUnreachableError(err: any): boolean {
  const msg = String(err?.message || err?.details || err || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('enotfound') ||
    msg.includes('networkerror') ||
    msg.includes('load failed')
  );
}

const DEMO_COMP_ID = '00000000-0000-0000-0000-000000000001';

function createHybridRepository<T extends object>(supabaseRepo: T, demoRepo: T): T {
  return new Proxy(supabaseRepo, {
    get(target, prop, receiver) {
      const origMethod = Reflect.get(target, prop, receiver);
      if (typeof origMethod !== 'function') {
        return origMethod;
      }

      return async function (...args: any[]) {
        const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
        if (isBrowser) {
          const firstArg = args[0];
          const isDemoArg =
            firstArg === DEMO_COMP_ID ||
            (typeof firstArg === 'string' && firstArg.endsWith('@nexoproduction.demo')) ||
            (typeof firstArg === 'string' && firstArg.startsWith('user-') && firstArg.endsWith('-demo'));

          if (isTestUserSessionActive() || isDemoArg) {
            const demoMethod = (demoRepo as any)[prop];
            if (typeof demoMethod === 'function') {
              return demoMethod.apply(demoRepo, args);
            }
          }
        }

        try {
          return await origMethod.apply(target, args);
        } catch (err: any) {
          if (isBrowser && isNetworkUnreachableError(err)) {
            console.warn(`[NEXO DB Fallback] Supabase inacessível em ${String(prop)}, ativando contingência de teste.`);
            setTestUserSessionActive(true);
            const demoMethod = (demoRepo as any)[prop];
            if (typeof demoMethod === 'function') {
              return demoMethod.apply(demoRepo, args);
            }
          }
          throw err;
        }
      };
    },
  });
}

function createRepositories(): RepositoryFactory {
  const isProduction = process.env.NEXT_PUBLIC_DEMO_MODE === 'false';

  if (isProduction) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      throw new Error(
        'CONFIGURAÇÃO INCOMPLETA: NEXT_PUBLIC_DEMO_MODE está definido como false, mas as credenciais de produção do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) não estão configuradas.'
      );
    }

    return {
      machines: createHybridRepository(new SupabaseMachineRepository(), demoRepositories.machines),
      orders: createHybridRepository(new SupabaseOrderRepository(), demoRepositories.orders),
      production: createHybridRepository(new SupabaseProductionRepository(), demoRepositories.production),
      downtime: createHybridRepository(new SupabaseDowntimeRepository(), demoRepositories.downtime),
      products: createHybridRepository(new SupabaseProductRepository(), demoRepositories.products),
      users: createHybridRepository(new SupabaseUserRepository(), demoRepositories.users),
      audit: createHybridRepository(new SupabaseAuditRepository(), demoRepositories.audit),
      apiKeys: createHybridRepository(new SupabaseApiKeyRepository(), demoRepositories.apiKeys),
      company: createHybridRepository(new SupabaseCompanyRepository(), demoRepositories.company),
    };
  }

  // Demo Mode
  return { ...demoRepositories };
}

export const repositories = createRepositories();

