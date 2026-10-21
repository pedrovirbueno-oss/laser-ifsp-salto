import { NextRequest, NextResponse } from 'next/server';
import { repositories, demoRepositories, IS_DEMO_MODE } from '@/repositories';
import { DEMO_COMPANY_ID } from '@/repositories/demo/seedData';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

// GET /api/users
export async function GET(req: NextRequest) {
  try {
    let companyId = DEMO_COMPANY_ID;
    const testSessionRole = req.cookies.get('nexo_test_session')?.value;
    const useDemoPersistence = IS_DEMO_MODE || Boolean(testSessionRole);

    if (testSessionRole) {
      if (testSessionRole !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem listar a equipe.' }, { status: 403 });
      }
      companyId = DEMO_COMPANY_ID;
    } else if (!IS_DEMO_MODE) {
      // 1. Validate real Supabase session from HTTP cookies
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
      }

      // 2. Fetch ADMIN profile via server-side Admin Client (bypassing RLS safely after authentication)
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: adminProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileErr || !adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem listar a equipe.' }, { status: 403 });
      }

      companyId = adminProfile.company_id;
    }

    let users;
    if (useDemoPersistence) {
      users = await demoRepositories.users.getAll(companyId);
    } else {
      const supabaseAdmin = createAdminSupabaseClient();
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      users = data || [];
    }

    const sanitizedUsers = users.map((u: any) => ({
      id: u.id,
      company_id: u.company_id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active ?? true,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    return NextResponse.json({ success: true, data: sanitizedUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

// POST /api/users
export async function POST(req: NextRequest) {
  try {
    let companyId = DEMO_COMPANY_ID;
    const testSessionRole = req.cookies.get('nexo_test_session')?.value;
    const useDemoPersistence = IS_DEMO_MODE || Boolean(testSessionRole);

    if (testSessionRole) {
      if (testSessionRole !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem cadastrar membros da equipe.' }, { status: 403 });
      }
      companyId = DEMO_COMPANY_ID;
    } else if (!IS_DEMO_MODE) {
      // 1. Validate real Supabase session from HTTP cookies
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Sessão expirada ou não autenticada.' }, { status: 401 });
      }

      // 2. Fetch ADMIN profile via server-side Admin Client (bypassing RLS safely after authentication)
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: adminProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileErr || !adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado: Somente administradores podem cadastrar membros da equipe.' }, { status: 403 });
      }

      // CRITICAL MULTI-TENANCY SECURITY:
      // Always extract company_id from the authenticated admin's profile
      companyId = adminProfile.company_id;
    }

    const body = await req.json();
    const { name, email, role, password } = body;

    // Field Validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'O nome do usuário é obrigatório.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido ou não informado.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Role Validation: ONLY 'operator' or 'supervisor' allowed. NEVER allow 'admin' promotion.
    if (role !== 'operator' && role !== 'supervisor') {
      return NextResponse.json({ error: 'Função inválida. Somente Operador ou Supervisor podem ser cadastrados.' }, { status: 400 });
    }

    // Password Validation: Minimum 8 characters
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'A senha deve conter no mínimo 8 caracteres.' }, { status: 400 });
    }

    // Check if email already exists
    if (useDemoPersistence) {
      const existingUser = await demoRepositories.users.getByEmail(normalizedEmail);
      if (existingUser) {
        return NextResponse.json({ error: 'E-mail já cadastrado no sistema.' }, { status: 409 });
      }
    } else {
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: existingProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        return NextResponse.json({ error: 'E-mail já cadastrado no sistema.' }, { status: 409 });
      }
    }

    if (useDemoPersistence) {
      const newProfile = await demoRepositories.users.create({
        id: `user-demo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        company_id: companyId,
        name: name.trim(),
        email: normalizedEmail,
        role: role as 'operator' | 'supervisor',
        active: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Usuário cadastrado com sucesso (Modo Demo).',
        data: {
          id: newProfile.id,
          company_id: newProfile.company_id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role,
          active: newProfile.active,
          created_at: newProfile.created_at,
        },
      }, { status: 201 });
    }


    // Production Mode: Create Auth user in Supabase Auth via Admin Service Role Client
    const supabaseAdmin = createAdminSupabaseClient();

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), role },
    });

    if (authErr || !authUser.user) {
      let friendlyError = authErr?.message || 'Erro ao criar usuário no Supabase Auth.';
      if (authErr?.message?.includes('already registered')) {
        friendlyError = 'E-mail já cadastrado no sistema.';
      }
      return NextResponse.json({ error: friendlyError }, { status: 400 });
    }

    // Create matching row in public.profiles via supabaseAdmin
    // SERVER FORCED: company_id = adminProfile.company_id, id = authUser.user.id
    try {
      const { data: newProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          company_id: companyId,
          name: name.trim(),
          email: normalizedEmail,
          role: role as 'operator' | 'supervisor',
          active: true,
        })
        .select()
        .single();

      if (profileErr || !newProfile) {
        throw profileErr || new Error('Falha na gravação do perfil.');
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário cadastrado com sucesso.',
        data: {
          id: newProfile.id,
          company_id: newProfile.company_id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role,
          active: newProfile.active,
          created_at: newProfile.created_at,
        },
      }, { status: 201 });
    } catch (profileErr: any) {
      // ROLLBACK: If profile creation fails, delete the created Auth user to prevent orphan users
      console.error('Profile creation failed. Triggering Auth user rollback:', profileErr);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: 'Falha ao criar perfil de usuário. Operação cancelada com segurança.' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno ao processar cadastro de usuário.' }, { status: 500 });
  }
}
