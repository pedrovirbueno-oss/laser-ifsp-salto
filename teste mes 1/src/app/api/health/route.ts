import { NextResponse } from 'next/server';
import { IS_DEMO_MODE } from '@/repositories';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { demoProfiles } from '@/repositories/demo/seedData';

export async function GET() {
  const startMs = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hasSecret = Boolean(process.env.SUPABASE_SECRET_KEY);
  const hasPublishable = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const testUsers = demoProfiles.map((p) => ({
    name: p.name,
    email: p.email,
    role: p.role,
    active: p.active,
  }));

  if (IS_DEMO_MODE) {
    return NextResponse.json({
      status: 'demo',
      database: {
        connected: true,
        mode: 'DEMO_IN_MEMORY',
        latencyMs: Date.now() - startMs,
        message: 'Modo Demonstração ativo em memória.',
      },
      testUsers: {
        available: true,
        count: testUsers.length,
        users: testUsers,
      },
    });
  }

  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const queryPromise = supabaseAdmin.from('companies').select('id, name').limit(1);
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'TIMEOUT_2200MS' } }), 2200)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - startMs;

    if (error) {
      const isDnsOrNetwork =
        error.message?.includes('fetch failed') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('TIMEOUT');

      return NextResponse.json({
        status: 'fallback',
        database: {
          connected: false,
          mode: 'SUPABASE_OFFLINE_FALLBACK',
          latencyMs,
          configuredKeys: hasSecret && hasPublishable,
          host: supabaseUrl ? new URL(supabaseUrl).hostname : 'unconfigured',
          message: isDnsOrNetwork
            ? 'Instância Supabase pausada ou sem resolução DNS (contingência local de Usuário Teste ativa).'
            : `Erro na verificação do banco: ${error.message}`,
        },
        testUsers: {
          available: true,
          count: testUsers.length,
          users: testUsers,
        },
      });
    }

    return NextResponse.json({
      status: 'online',
      database: {
        connected: true,
        mode: 'SUPABASE_PRODUCTION',
        latencyMs,
        configuredKeys: hasSecret && hasPublishable,
        companiesFound: data?.length || 0,
        message: 'Banco de dados Supabase conectado e validado com sucesso.',
      },
      testUsers: {
        available: true,
        count: testUsers.length,
        users: testUsers,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'fallback',
      database: {
        connected: false,
        mode: 'SUPABASE_OFFLINE_FALLBACK',
        latencyMs: Date.now() - startMs,
        configuredKeys: hasSecret && hasPublishable,
        message: 'Contingência ativa para Usuário Teste (banco externo indisponível no momento).',
      },
      testUsers: {
        available: true,
        count: testUsers.length,
        users: testUsers,
      },
    });
  }
}
