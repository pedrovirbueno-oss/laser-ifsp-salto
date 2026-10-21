import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const isProduction = process.env.NEXT_PUBLIC_DEMO_MODE === 'false';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (isProduction) {
    if (!supabaseUrl || !supabasePublishableKey || supabaseUrl.includes('placeholder')) {
      throw new Error(
        '[CONFIGURAÇÃO INCOMPLETA] Modo Produção ativo (NEXT_PUBLIC_DEMO_MODE=false), mas as credenciais do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) não estão configuradas.'
      );
    }
  }

  const finalUrl = supabaseUrl || 'https://demo-unconfigured.supabase.co';
  const finalKey = supabasePublishableKey || 'demo-publishable-key';

  return createServerClient(finalUrl, finalKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handled in middleware/server component lifecycle
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handled in middleware/server component lifecycle
        }
      },
    },
  });
}

export function createAdminSupabaseClient() {
  const isProduction = process.env.NEXT_PUBLIC_DEMO_MODE === 'false';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('[SECURITY ERROR] SUPABASE_SECRET_KEY é obrigatória para operações administrativas no servidor.');
  }

  if (isProduction && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
    throw new Error('[SECURITY ERROR] NEXT_PUBLIC_SUPABASE_URL não configurada no servidor de produção.');
  }

  const finalUrl = supabaseUrl || 'https://demo-unconfigured.supabase.co';

  return createServerClient(finalUrl, secretKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
  });
}
