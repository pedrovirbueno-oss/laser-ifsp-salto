'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Profile, UserRole, Company } from '@/types';
import {
  repositories,
  demoRepositories,
  IS_DEMO_MODE,
  isTestUserSessionActive,
  setTestUserSessionActive,
} from '@/repositories';
import { DEMO_COMPANY_ID } from '@/repositories/demo/seedData';

interface AuthContextType {
  user: Profile | null;
  company: Company | null;
  role: UserRole;
  isDemoMode: boolean;
  isTestSession: boolean;
  isLoading: boolean;
  switchDemoRole: (newRole: UserRole) => void;
  loginDemoUser: (email: string) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkFirstAccessSetup: () => Promise<boolean>;
  reloadCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AUTH_CACHE_KEY = 'nexo_cached_auth_v1';

function saveAuthCache(profile: Profile | null, comp: Company | null) {
  if (typeof window === 'undefined') return;
  try {
    if (profile && comp) {
      window.sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user: profile, company: comp }));
    } else {
      window.sessionStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function loadAuthCache(): { user: Profile; company: Company } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<UserRole>('admin');
  const [isTestSession, setIsTestSession] = useState<boolean>(IS_DEMO_MODE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Instant hydration from sessionStorage cache for fast page transitions
        const cached = loadAuthCache();
        if (cached?.user && cached?.company) {
          setUser(cached.user);
          setRole(cached.user.role);
          setCompany(cached.company);
          setIsTestSession(IS_DEMO_MODE || isTestUserSessionActive());
          setIsLoading(false);
        }

        // 2. Demo Mode or Active Test User Session
        if (IS_DEMO_MODE || isTestUserSessionActive()) {
          const savedRole =
            (typeof window !== 'undefined' &&
              (window.sessionStorage.getItem('nexo_test_role') as UserRole | null)) ||
            'admin';
          const emailMap: Record<UserRole, string> = {
            admin: 'admin@nexoproduction.demo',
            supervisor: 'supervisor@nexoproduction.demo',
            operator: 'operador@nexoproduction.demo',
          };
          const targetEmail = emailMap[savedRole] || 'admin@nexoproduction.demo';
          const [prof, comp] = await Promise.all([
            demoRepositories.users.getByEmail(targetEmail),
            demoRepositories.company.getById(DEMO_COMPANY_ID),
          ]);
          if (prof && comp) {
            setUser(prof);
            setRole(prof.role);
            setCompany(comp);
            setIsTestSession(true);
            setTestUserSessionActive(true, prof.role);
            saveAuthCache(prof, comp);
          }
          return;
        }

        // 3. Production Supabase Auth check (protected by 2.5s timeout so browser never hangs)
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2500)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

        if (session?.user) {
          const profile = await repositories.users.getById(session.user.id);
          if (profile) {
            const comp = await repositories.company.getById(profile.company_id);
            setUser(profile);
            setRole(profile.role);
            setCompany(comp);
            setIsTestSession(false);
            saveAuthCache(profile, comp);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const reloadCompany = async (): Promise<void> => {
    const compId = company?.id || user?.company_id;
    if (compId) {
      const comp = await repositories.company.getById(compId);
      if (comp) {
        setCompany(comp);
        if (user) saveAuthCache(user, comp);
      }
    }
  };

  const switchDemoRole = async (newRole: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      admin: 'admin@nexoproduction.demo',
      supervisor: 'supervisor@nexoproduction.demo',
      operator: 'operador@nexoproduction.demo',
    };

    const targetEmail = emailMap[newRole];
    const [profile, comp] = await Promise.all([
      demoRepositories.users.getByEmail(targetEmail),
      demoRepositories.company.getById(DEMO_COMPANY_ID),
    ]);

    if (profile && comp) {
      setTestUserSessionActive(true, profile.role);
      setIsTestSession(true);
      setUser(profile);
      setRole(profile.role);
      setCompany(comp);
      saveAuthCache(profile, comp);

      // Auto route to appropriate screen
      if (profile.role === 'operator' && pathname !== '/operator') {
        router.push('/operator');
      } else if (profile.role !== 'operator' && pathname === '/operator') {
        router.push('/dashboard');
      }
    }
  };

  const loginDemoUser = async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    // Map generic test email aliases to demo profiles
    const mappedEmail =
      normalized === 'teste@nexoproduction.com' || normalized === 'admin@teste.com'
        ? 'admin@nexoproduction.demo'
        : normalized === 'operador@teste.com'
        ? 'operador@nexoproduction.demo'
        : normalized === 'supervisor@teste.com'
        ? 'supervisor@nexoproduction.demo'
        : normalized;

    const [profile, comp] = await Promise.all([
      demoRepositories.users.getByEmail(mappedEmail),
      demoRepositories.company.getById(DEMO_COMPANY_ID),
    ]);

    if (profile && comp) {
      setTestUserSessionActive(true, profile.role);
      setIsTestSession(true);
      setUser(profile);
      setRole(profile.role);
      setCompany(comp);
      saveAuthCache(profile, comp);

      if (profile.role === 'operator') {
        router.push('/operator');
      } else if (profile.role === 'admin' && (comp.setup_completed_at === null || comp.setup_completed_at === undefined)) {
        router.push('/setup');
      } else {
        router.push('/dashboard');
      }
      return true;
    }
    return false;
  };

  const loginWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Direct support for Test Users (@nexoproduction.demo or @teste.com) in both modes
    if (
      IS_DEMO_MODE ||
      normalizedEmail.endsWith('@nexoproduction.demo') ||
      normalizedEmail.endsWith('@teste.com') ||
      normalizedEmail === 'teste@nexoproduction.com'
    ) {
      const ok = await loginDemoUser(normalizedEmail);
      if (ok) return { success: true };
      return { success: false, error: 'Usuário não encontrado ou credenciais inválidas.' };
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const signInPromise = supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      const timeoutPromise = new Promise<{ data: { user: null }; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, error: { message: 'Failed to fetch (Timeout)' } }), 3500)
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

      if (error) {
        const rawMsg = error.message || '';
        // If Supabase is paused/offline (ENOTFOUND / Failed to fetch), explain clearly and guide to Test User or DB reactivation
        if (
          rawMsg.toLowerCase().includes('failed to fetch') ||
          rawMsg.toLowerCase().includes('fetch failed') ||
          rawMsg.toLowerCase().includes('networkerror')
        ) {
          return {
            success: false,
            error:
              'Banco Supabase inacessível no momento (instância pausada ou sem rede). Utilize os botões de Usuário Teste abaixo para validar o sistema imediatamente.',
          };
        }

        let errorMsg = rawMsg;
        if (rawMsg.includes('Invalid login credentials')) {
          errorMsg = 'Usuário não encontrado ou credenciais inválidas.';
        } else if (rawMsg.includes('Email not confirmed')) {
          errorMsg = 'E-mail não confirmado no Supabase. Confirme o e-mail para acessar.';
        }
        return { success: false, error: errorMsg };
      }

      if (!data.user) {
        return { success: false, error: 'Falha na autenticação. Usuário não retornado pelo Supabase.' };
      }

      const profile = await repositories.users.getById(data.user.id);
      if (!profile) {
        return {
          success: false,
          error: 'Perfil de usuário não configurado no sistema. Execute o bootstrap inicial.',
        };
      }

      if (!profile.active) {
        return { success: false, error: 'Sua conta de usuário está inativa. Entre em contato com o administrador.' };
      }

      const comp = await repositories.company.getById(profile.company_id);

      setTestUserSessionActive(false);
      setIsTestSession(false);
      setUser(profile);
      setRole(profile.role);
      setCompany(comp);
      saveAuthCache(profile, comp);

      if (profile.role === 'operator') {
        router.push('/operator');
      } else if (profile.role === 'admin' && comp && (comp.setup_completed_at === null || comp.setup_completed_at === undefined)) {
        router.push('/setup');
      } else {
        router.push('/dashboard');
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error during Production loginWithPassword:', err);
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        return {
          success: false,
          error:
            'Banco Supabase inacessível no momento (instância pausada ou offline). Utilize os botões de Usuário Teste abaixo para validar o sistema imediatamente.',
        };
      }
      return {
        success: false,
        error: err?.message || 'Erro inesperado durante o login em Produção.',
      };
    }
  };

  const logout = async () => {
    setTestUserSessionActive(false);
    setIsTestSession(IS_DEMO_MODE);
    saveAuthCache(null, null);

    if (!IS_DEMO_MODE && !isTestUserSessionActive()) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch {
        // Ignore signOut network errors when offline
      }
    }
    setUser(null);
    setCompany(null);
    router.push('/login');
  };

  const checkFirstAccessSetup = async (): Promise<boolean> => {
    if (!company) return false;
    const [machines, products, shifts] = await Promise.all([
      repositories.machines.getAll(company.id),
      repositories.products.getAll(company.id),
      repositories.company.getShifts(company.id),
    ]);

    const isSetupComplete = machines.length >= 1 && products.length >= 1 && shifts.length >= 1;
    return isSetupComplete;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        role,
        isDemoMode: IS_DEMO_MODE,
        isTestSession,
        isLoading,
        switchDemoRole,
        loginDemoUser,
        loginWithPassword,
        logout,
        checkFirstAccessSetup,
        reloadCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

