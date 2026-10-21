import { NextRequest, NextResponse } from 'next/server';
import { repositories, IS_DEMO_MODE } from '@/repositories';
import { DEMO_COMPANY_ID } from '@/repositories/demo/seedData';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    let companyId = DEMO_COMPANY_ID;

    if (!IS_DEMO_MODE) {
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const adminProfile = await repositories.users.getById(session.user.id);
      if (!adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem criar contas operacionais via setup' }, { status: 403 });
      }
      companyId = adminProfile.company_id;
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios para o operador' }, { status: 400 });
    }

    const existing = await repositories.users.getByEmail(email);
    if (existing) {
      return NextResponse.json({ success: true, message: 'Operador já cadastrado', data: existing });
    }

    if (IS_DEMO_MODE) {
      const opProfile = await repositories.users.create({
        id: `op-${Date.now()}`,
        company_id: companyId,
        name,
        email,
        role: 'operator',
        active: true,
      });
      return NextResponse.json({ success: true, message: 'Operador criado (Modo Demo)', data: opProfile }, { status: 201 });
    }

    // Production Mode: Create Auth user in Supabase Auth via Admin API
    const supabaseAdmin = createAdminSupabaseClient();
    const opPassword = password || `NexoOp#${Math.random().toString(36).slice(-8)}`;

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: opPassword,
      email_confirm: true,
      user_metadata: { name, role: 'operator' },
    });

    if (authErr || !authUser.user) {
      return NextResponse.json({ error: `Erro ao criar operador no Supabase Auth: ${authErr?.message}` }, { status: 500 });
    }

    const opProfile = await repositories.users.create({
      id: authUser.user.id,
      company_id: companyId,
      name,
      email,
      role: 'operator',
      active: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Operador cadastrado com sucesso no Supabase Auth e Profiles',
      data: opProfile,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao cadastrar operador' }, { status: 500 });
  }
}
