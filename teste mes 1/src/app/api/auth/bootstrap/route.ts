import { NextRequest, NextResponse } from 'next/server';
import { repositories, IS_DEMO_MODE } from '@/repositories';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/bootstrap
 * Check if the bootstrap is locked (an ADMIN user already exists in the system).
 */
export async function GET() {
  try {
    if (IS_DEMO_MODE) {
      const existingUser = await repositories.users.getByEmail('admin@nexoproduction.demo');
      return NextResponse.json({ isLocked: !!existingUser });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const { data: existingAdmins } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin').limit(1);
    return NextResponse.json({ isLocked: existingAdmins && existingAdmins.length > 0 });
  } catch (err: any) {
    return NextResponse.json({ isLocked: false });
  }
}

/**
 * POST /api/auth/bootstrap
 * Initial bootstrap endpoint for NEXO Production.
 * Creates Company + Auth User + ADMIN Profile.
 *
 * ATOMICITY & ROLLBACK DOCUMENTATION:
 * PostgreSQL DB and Supabase Auth API exist across separate service boundaries (HTTP API vs DB connection).
 * Because cross-service database transactions are not native across HTTP APIs, this handler implements
 * explicit, defensive rollback logic: if Auth creation or Profile creation fails, any resources created
 * during the current execution (company / auth user) are cleaned up immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, legal_name, document, email, phone, timezone, admin_name, admin_email, password } = body;

    // 1. Validate required fields
    if (!company_name || !document || !admin_email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes para o bootstrap da empresa (empresa, documento, e-mail do admin e senha).' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha do administrador deve ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    // 2. Demo Mode handling
    if (IS_DEMO_MODE) {
      const existingUser = await repositories.users.getByEmail(admin_email);
      if (existingUser && existingUser.role === 'admin') {
        return NextResponse.json({ error: 'Bootstrap bloqueado: Já existe um administrador cadastrado.' }, { status: 400 });
      }

      const newCompany = await repositories.company.create({
        name: company_name,
        legal_name: legal_name || company_name,
        document,
        email: email || '',
        phone: phone || '',
        timezone: timezone || 'America/Sao_Paulo',
        active: true,
      });

      const adminProfile = await repositories.users.create({
        id: `admin-${Date.now()}`,
        company_id: newCompany.id,
        name: admin_name || 'Administrador',
        email: admin_email,
        role: 'admin',
        active: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Bootstrap inicial da empresa concluído com sucesso (Modo Demo)',
        company: newCompany,
        admin: adminProfile,
      }, { status: 201 });
    }

    // 3. Production Mode pre-checks using Supabase Admin API with Atomic Singleton Lock
    const supabaseAdmin = createAdminSupabaseClient();

    // 3a. Try acquiring atomic singleton lock via database RPC (serializes concurrent requests at DB level)
    const { data: canProceed, error: lockErr } = await supabaseAdmin.rpc('acquire_bootstrap_lock');

    if (lockErr) {
      // Fallback check if RPC is not present in local test mock environments
      const { data: existingAdmins } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin').limit(1);
      if (existingAdmins && existingAdmins.length > 0) {
        return NextResponse.json({ error: 'Bootstrap bloqueado: Já existe um administrador cadastrado no sistema.' }, { status: 400 });
      }
    } else if (!canProceed) {
      return NextResponse.json({ error: 'Bootstrap bloqueado: Já existe um administrador cadastrado no sistema.' }, { status: 400 });
    }

    // 3b. Pre-check if admin_email already exists in auth.users to avoid orphan company creation
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === admin_email.toLowerCase()
    );

    if (existingAuthUser) {
      return NextResponse.json(
        {
          error: 'Já existe uma conta registrada no Supabase Auth com este e-mail. O bootstrap inicial exige a utilização de um novo e-mail corporativo.',
        },
        { status: 400 }
      );
    }

    // 4. Defensive step-by-step execution with orphan prevention rollback
    let createdCompanyId: string | null = null;
    let createdAuthUserId: string | null = null;

    try {
      // Step 4.1: Create company record directly via supabaseAdmin (bypassing RLS with SUPABASE_SECRET_KEY)
      const { data: newCompany, error: companyErr } = await supabaseAdmin
        .from('companies')
        .insert({
          name: company_name,
          legal_name: legal_name || company_name,
          document,
          email: email || '',
          phone: phone || '',
          timezone: timezone || 'America/Sao_Paulo',
          active: true,
        })
        .select()
        .single();

      if (companyErr || !newCompany) {
        return NextResponse.json(
          { error: `Erro ao criar empresa no banco de dados: ${companyErr?.message || 'Falha na gravação.'}` },
          { status: 500 }
        );
      }
      createdCompanyId = newCompany.id;

      // Step 4.2: Create Auth user via Supabase Admin API
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password,
        email_confirm: true,
        user_metadata: { name: admin_name || 'Administrador' },
      });

      if (authErr || !authUser.user) {
        // Rollback created company
        if (createdCompanyId) {
          await supabaseAdmin.from('companies').delete().eq('id', createdCompanyId);
        }
        return NextResponse.json(
          { error: `Erro ao criar usuário no Supabase Auth: ${authErr?.message || 'Falha na criação de conta.'}` },
          { status: 500 }
        );
      }
      createdAuthUserId = authUser.user.id;

      // Step 4.3: Create Profile record linked to auth.users.id and forced role 'admin' directly via supabaseAdmin
      const { data: adminProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          company_id: newCompany.id,
          name: admin_name || 'Administrador',
          email: admin_email,
          role: 'admin', // FORCED SERVER-SIDE ROLE
          active: true,
        })
        .select()
        .single();

      if (profileErr || !adminProfile) {
        // Rollback created Auth user AND created company
        if (createdAuthUserId) {
          await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        }
        if (createdCompanyId) {
          await supabaseAdmin.from('companies').delete().eq('id', createdCompanyId);
        }
        return NextResponse.json(
          { error: `Erro ao criar perfil de Administrador no banco de dados: ${profileErr?.message || 'Falha na gravação do perfil.'}` },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Empresa e usuário Administrador criados com sucesso em Produção',
          company: newCompany,
          admin: adminProfile,
        },
        { status: 201 }
      );
    } catch (innerErr: any) {
      // General rollback safety net
      if (createdAuthUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        } catch {}
      }
      if (createdCompanyId) {
        try {
          await supabaseAdmin.from('companies').delete().eq('id', createdCompanyId);
        } catch {}
      }
      return NextResponse.json(
        { error: innerErr.message || 'Erro inesperado durante o bootstrap inicial.' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro durante o bootstrap inicial' }, { status: 500 });
  }
}
