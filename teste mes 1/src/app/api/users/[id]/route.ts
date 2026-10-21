import { NextRequest, NextResponse } from 'next/server';
import { repositories, demoRepositories, IS_DEMO_MODE } from '@/repositories';
import { DEMO_COMPANY_ID } from '@/repositories/demo/seedData';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const targetUserId = params.id;
    if (!targetUserId) {
      return NextResponse.json({ error: 'ID do usuário não informado.' }, { status: 400 });
    }

    let adminCompanyId = DEMO_COMPANY_ID;
    const testSessionRole = req.cookies.get('nexo_test_session')?.value;
    const useDemoPersistence = IS_DEMO_MODE || Boolean(testSessionRole);

    if (testSessionRole) {
      if (testSessionRole !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem editar usuários.' }, { status: 403 });
      }
      adminCompanyId = DEMO_COMPANY_ID;
    } else if (!IS_DEMO_MODE) {
      // 1. Validate real Supabase session from HTTP cookies
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Sessão expirada ou não autenticada.' }, { status: 401 });
      }

      // 2. Fetch ADMIN profile via server-side Admin Client (bypassing RLS safely after authentication)
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: adminProfile, error: adminErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (adminErr || !adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem editar usuários.' }, { status: 403 });
      }

      adminCompanyId = adminProfile.company_id;
    }

    // Fetch target user profile
    let targetProfile;
    if (useDemoPersistence) {
      targetProfile = await demoRepositories.users.getById(targetUserId);
    } else {
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: tProfile, error: tErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (tErr || !tProfile) {
        targetProfile = null;
      } else {
        targetProfile = tProfile;
      }
    }

    if (!targetProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // STRICT MULTI-TENANCY SECURITY CHECK:
    // Confirm target user belongs to the requesting admin's company
    if (targetProfile.company_id !== adminCompanyId) {
      return NextResponse.json({ error: 'Acesso negado: Você só pode editar usuários da sua própria empresa.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, role, active, company_id } = body;

    // Reject attempt to modify company_id or inject cross-tenant payload
    if (company_id && company_id !== adminCompanyId) {
      return NextResponse.json({ error: 'Alteração de empresa não permitida.' }, { status: 400 });
    }

    // Reject attempt to promote user to admin
    if (role === 'admin') {
      return NextResponse.json({ error: 'Promoção a Administrador não é permitida por esta interface.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (name && typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }

    if (role === 'operator' || role === 'supervisor') {
      updates.role = role;
    }

    if (typeof active === 'boolean') {
      updates.active = active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualização enviado.' }, { status: 400 });
    }

    if (useDemoPersistence) {
      const updated = await demoRepositories.users.update(targetUserId, updates);
      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado com sucesso (Modo Demo).',
        data: updated,
      });
    }


    // Production Mode: Update profile in Supabase via supabaseAdmin
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .eq('company_id', adminCompanyId)
      .select()
      .single();

    if (updateErr || !updatedProfile) {
      return NextResponse.json({ error: `Erro ao atualizar perfil: ${updateErr?.message || 'Falha na gravação.'}` }, { status: 500 });
    }

    // Also update Auth metadata if name or role changed
    if (updates.name || updates.role) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.role ? { role: updates.role } : {}),
          },
        });
      } catch (authUpdateErr) {
        console.warn('Failed to update Auth metadata for user:', targetUserId, authUpdateErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso.',
      data: updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}
