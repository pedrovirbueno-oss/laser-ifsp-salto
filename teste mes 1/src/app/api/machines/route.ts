import { NextRequest, NextResponse } from 'next/server';
import { repositories, IS_DEMO_MODE } from '@/repositories';
import { DEMO_COMPANY_ID } from '@/repositories/demo/seedData';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    let companyId = DEMO_COMPANY_ID;

    if (!IS_DEMO_MODE) {
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const profile = await repositories.users.getById(session.user.id);
      if (!profile) {
        return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 401 });
      }
      companyId = profile.company_id;
    }

    const machines = await repositories.machines.getAll(companyId);
    return NextResponse.json({ success: true, count: machines.length, data: machines });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao buscar máquinas' }, { status: 500 });
  }
}

