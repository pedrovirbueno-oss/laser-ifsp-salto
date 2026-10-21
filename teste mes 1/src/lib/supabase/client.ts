import { createBrowserClient } from '@supabase/ssr';

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;
let cachedKeySignature = '';

export function createClient() {
  const isProduction = process.env.NEXT_PUBLIC_DEMO_MODE === 'false';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (isProduction) {
    if (!supabaseUrl || !supabasePublishableKey || supabaseUrl.includes('placeholder')) {
      throw new Error(
        '[CONFIGURAÇÃO INCOMPLETA] Modo Produção ativo (NEXT_PUBLIC_DEMO_MODE=false), mas as credenciais do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) não estão configuradas.'
      );
    }
    const sig = `${supabaseUrl}::${supabasePublishableKey}`;
    if (typeof window !== 'undefined' && cachedClient && cachedKeySignature === sig) {
      return cachedClient;
    }
    const client = createBrowserClient(supabaseUrl, supabasePublishableKey);
    if (typeof window !== 'undefined') {
      cachedClient = client;
      cachedKeySignature = sig;
    }
    return client;
  }

  const finalUrl = supabaseUrl || 'https://demo-unconfigured.supabase.co';
  const finalKey = supabasePublishableKey || 'demo-publishable-key';
  const sig = `${finalUrl}::${finalKey}`;

  if (typeof window !== 'undefined' && cachedClient && cachedKeySignature === sig) {
    return cachedClient;
  }

  const client = createBrowserClient(finalUrl, finalKey);
  if (typeof window !== 'undefined') {
    cachedClient = client;
    cachedKeySignature = sig;
  }
  return client;
}

