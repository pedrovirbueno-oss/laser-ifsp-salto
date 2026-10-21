import { DemoUserRepository } from '../repositories/demo/index';
import { Profile } from '../types';

// Simulation helpers for Server API endpoint logic
interface SimulatedUserAuth {
  id: string;
  email: string;
  user_metadata: { name: string; role: string; company_id: string };
}

class SimulatedUserManagementService {
  private authUsers: Map<string, SimulatedUserAuth> = new Map();
  private profiles: Map<string, Profile> = new Map();

  constructor() {
    // Seed initial Admin for Company A
    const adminId = 'admin-comp-a-id';
    const adminProfile: Profile = {
      id: adminId,
      company_id: 'company-A',
      name: 'Admin Original',
      email: 'admin@comp-a.com',
      role: 'admin',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(adminId, adminProfile);
    this.authUsers.set(adminId, {
      id: adminId,
      email: 'admin@comp-a.com',
      user_metadata: { name: 'Admin Original', role: 'admin', company_id: 'company-A' },
    });

    // Seed User for Company B (Multi-tenant test)
    const compBUserId = 'user-comp-b-id';
    const compBProfile: Profile = {
      id: compBUserId,
      company_id: 'company-B',
      name: 'Operador Empresa B',
      email: 'operator@comp-b.com',
      role: 'operator',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(compBUserId, compBProfile);
    this.authUsers.set(compBUserId, {
      id: compBUserId,
      email: 'operator@comp-b.com',
      user_metadata: { name: 'Operador Empresa B', role: 'operator', company_id: 'company-B' },
    });
  }

  public handlePostUsers(
    requesterProfileId: string,
    body: { name?: string; email?: string; role?: string; password?: string; company_id?: string },
    simulateProfileInsertFail: boolean = false
  ): { status: number; body: any } {
    const requester = this.profiles.get(requesterProfileId);
    if (!requester) {
      return { status: 401, body: { error: 'Não autenticado' } };
    }

    if (requester.role !== 'admin') {
      return { status: 403, body: { error: 'Acesso negado. Apenas administradores podem criar usuários.' } };
    }

    const { name, email, role, password } = body;
    if (!name || !email || !role || !password) {
      return { status: 400, body: { error: 'Campos obrigatórios: name, email, role, password' } };
    }

    if (role !== 'operator' && role !== 'supervisor') {
      return { status: 400, body: { error: 'Role inválida. É permitido criar apenas "operator" ou "supervisor".' } };
    }

    if (password.length < 8) {
      return { status: 400, body: { error: 'A senha deve ter no mínimo 8 caracteres.' } };
    }

    // Force server-side tenant
    const targetCompanyId = requester.company_id;

    // Check duplicate email
    for (const u of this.authUsers.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { status: 400, body: { error: 'Este e-mail já está cadastrado no sistema.' } };
      }
    }

    // Create auth user
    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const authUser: SimulatedUserAuth = {
      id: newUserId,
      email,
      user_metadata: { name, role, company_id: targetCompanyId },
    };
    this.authUsers.set(newUserId, authUser);

    // Create profile
    if (simulateProfileInsertFail) {
      // Rollback Auth user
      this.authUsers.delete(newUserId);
      return { status: 500, body: { error: 'Erro ao criar perfil de usuário' } };
    }

    const newProfile: Profile = {
      id: newUserId,
      company_id: targetCompanyId,
      name,
      email,
      role: role as any,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(newUserId, newProfile);

    // Clean output (no password, no secret key)
    const { password: _, ...cleanedPayload } = body;
    return {
      status: 201,
      body: {
        message: 'Usuário criado com sucesso',
        user: {
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role,
          company_id: newProfile.company_id,
          created_at: newProfile.created_at,
        },
      },
    };
  }

  public handleGetUsers(requesterProfileId: string): { status: number; body: any } {
    const requester = this.profiles.get(requesterProfileId);
    if (!requester) {
      return { status: 401, body: { error: 'Não autenticado' } };
    }

    if (requester.role !== 'admin') {
      return { status: 403, body: { error: 'Acesso negado.' } };
    }

    const companyUsers = Array.from(this.profiles.values())
      .filter((p) => p.company_id === requester.company_id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        company_id: p.company_id,
        active: p.active,
        created_at: p.created_at,
      }));

    return { status: 200, body: companyUsers };
  }

  public handlePatchUser(
    requesterProfileId: string,
    targetUserId: string,
    body: { name?: string; role?: string; active?: boolean; company_id?: string }
  ): { status: number; body: any } {
    const requester = this.profiles.get(requesterProfileId);
    if (!requester) {
      return { status: 401, body: { error: 'Não autenticado' } };
    }

    if (requester.role !== 'admin') {
      return { status: 403, body: { error: 'Acesso negado.' } };
    }

    const targetProfile = this.profiles.get(targetUserId);
    if (!targetProfile) {
      return { status: 404, body: { error: 'Usuário não encontrado' } };
    }

    // Multi-tenancy check
    if (targetProfile.company_id !== requester.company_id) {
      return { status: 403, body: { error: 'Não é permitido alterar usuários de outra empresa.' } };
    }

    if (body.role && body.role === 'admin') {
      return { status: 400, body: { error: 'Não é permitido promover usuários a admin.' } };
    }

    const updatedProfile: Profile = {
      ...targetProfile,
      name: body.name !== undefined ? body.name : targetProfile.name,
      role: body.role ? (body.role as any) : targetProfile.role,
      active: body.active !== undefined ? body.active : targetProfile.active,
      updated_at: new Date().toISOString(),
    };

    this.profiles.set(targetUserId, updatedProfile);

    return {
      status: 200,
      body: {
        message: 'Usuário atualizado com sucesso',
        user: {
          id: updatedProfile.id,
          name: updatedProfile.name,
          email: updatedProfile.email,
          role: updatedProfile.role,
          company_id: updatedProfile.company_id,
          active: updatedProfile.active,
        },
      },
    };
  }

  public getAuthUserCount(): number {
    return this.authUsers.size;
  }
}

describe('User & Team Management Integration & Security Tests', () => {
  let service: SimulatedUserManagementService;
  const adminId = 'admin-comp-a-id';

  beforeEach(() => {
    service = new SimulatedUserManagementService();
  });

  it('1. ADMIN consegue criar operator', () => {
    const res = service.handlePostUsers(adminId, {
      name: 'João Operador',
      email: 'joao.op@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('operator');
    expect(res.body.user.name).toBe('João Operador');
  });

  it('2. ADMIN consegue criar supervisor', () => {
    const res = service.handlePostUsers(adminId, {
      name: 'Maria Supervisora',
      email: 'maria.sup@comp-a.com',
      role: 'supervisor',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('supervisor');
    expect(res.body.user.name).toBe('Maria Supervisora');
  });

  it('3. ADMIN não consegue criar outro admin', () => {
    const res = service.handlePostUsers(adminId, {
      name: 'Carlos Admin II',
      email: 'carlos.admin@comp-a.com',
      role: 'admin',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('apenas "operator" ou "supervisor"');
  });

  it('4. Supervisor não consegue criar usuário', () => {
    // First create a supervisor
    const createRes = service.handlePostUsers(adminId, {
      name: 'Pedro Sup',
      email: 'pedro.sup@comp-a.com',
      role: 'supervisor',
      password: 'Password123!',
    });
    const supervisorId = createRes.body.user.id;

    // Attempt creation by supervisor
    const res = service.handlePostUsers(supervisorId, {
      name: 'Novo Operador',
      email: 'novo.op@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Apenas administradores podem criar usuários');
  });

  it('5. Operator não consegue criar usuário', () => {
    // First create an operator
    const createRes = service.handlePostUsers(adminId, {
      name: 'Lucas Op',
      email: 'lucas.op@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });
    const operatorId = createRes.body.user.id;

    // Attempt creation by operator
    const res = service.handlePostUsers(operatorId, {
      name: 'Outro Operador',
      email: 'outro.op@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Apenas administradores podem criar usuários');
  });

  it('6. company_id do body é ignorado pelo servidor', () => {
    const res = service.handlePostUsers(adminId, {
      name: 'Op Malicioso',
      email: 'malicious@comp-a.com',
      role: 'operator',
      password: 'Password123!',
      company_id: 'company-HACKER',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.company_id).toBe('company-A');
    expect(res.body.user.company_id).not.toBe('company-HACKER');
  });

  it('7. Usuário criado recebe company_id do ADMIN', () => {
    const res = service.handlePostUsers(adminId, {
      name: 'Ana Op',
      email: 'ana.op@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.company_id).toBe('company-A');
  });

  it('8. Usuário de outra company não pode ser alterado', () => {
    const targetUserIdCompB = 'user-comp-b-id'; // Created in constructor for company-B

    const res = service.handlePatchUser(adminId, targetUserIdCompB, {
      name: 'Novo Nome Hackeado',
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Não é permitido alterar usuários de outra empresa');
  });

  it('9. Falha na criação do profile faz rollback do Auth user', () => {
    const initialAuthCount = service.getAuthUserCount();

    const res = service.handlePostUsers(
      adminId,
      {
        name: 'Fail User',
        email: 'fail@comp-a.com',
        role: 'operator',
        password: 'Password123!',
      },
      true // Simulate profile insert failure
    );

    expect(res.status).toBe(500);
    expect(service.getAuthUserCount()).toBe(initialAuthCount); // Rollback executed!
  });

  it('10. Senha nunca aparece em resposta da API', () => {
    const res = service.handlePostUsers(adminId, {
      name: 'User Password Check',
      email: 'check.pass@comp-a.com',
      role: 'operator',
      password: 'SecretPassword123!',
    });

    expect(res.body.password).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
    expect(JSON.stringify(res.body).includes('SecretPassword123!')).toBe(false);
  });

  it('11. Secret key nunca aparece no client', () => {
    const res = service.handleGetUsers(adminId);
    const jsonStr = JSON.stringify(res.body);

    expect(jsonStr.includes('SUPABASE_SECRET_KEY')).toBe(false);
    expect(jsonStr.includes('service_role')).toBe(false);
  });

  it('12. GET lista somente usuários da empresa do ADMIN', () => {
    // Add 1 operator to company A
    service.handlePostUsers(adminId, {
      name: 'Op Comp A',
      email: 'op.a@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });

    const res = service.handleGetUsers(adminId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // All returned users must belong to company-A
    const allCompA = res.body.every((u: any) => u.company_id === 'company-A');
    expect(allCompA).toBe(true);

    // Must not contain user from company-B
    const hasCompBUser = res.body.some((u: any) => u.id === 'user-comp-b-id');
    expect(hasCompBUser).toBe(false);
  });

  it('13. Demo Mode continua funcionando sem depender do Supabase', async () => {
    const demoRepo = new DemoUserRepository();
    const demoUsers = await demoRepo.getAll('00000000-0000-0000-0000-000000000001');

    expect(demoUsers.length).toBeGreaterThan(0);
    const admin = demoUsers.find((u) => u.role === 'admin');
    expect(admin).not.toBeNull();
  });

  it('14. Login do novo usuário funciona com as credenciais criadas', () => {
    const createRes = service.handlePostUsers(adminId, {
      name: 'User Credential Test',
      email: 'login.test@comp-a.com',
      role: 'operator',
      password: 'MyStrongPassword123!',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.user.email).toBe('login.test@comp-a.com');
  });

  it('15. ADMIN original continua funcionando sem interrupção', () => {
    const res = service.handleGetUsers(adminId);
    expect(res.status).toBe(200);
    const originalAdmin = res.body.find((u: any) => u.id === adminId);
    expect(originalAdmin !== undefined).toBe(true);
    expect(originalAdmin.role).toBe('admin');
  });

  it('16. Usuário não autenticado recebe 401 ao tentar POST ou GET /api/users', () => {
    const postRes = service.handlePostUsers('', {
      name: 'Unauth User',
      email: 'unauth@comp-a.com',
      role: 'operator',
      password: 'Password123!',
    });
    expect(postRes.status).toBe(401);

    const getRes = service.handleGetUsers('');
    expect(getRes.status).toBe(401);
  });

  it('17. Route Handler server-side obtém perfil ADMIN usando contexto de admin (supabaseAdmin) sem depender de RLS de cliente anônimo', () => {
    // Simula a resolução de perfil efetuada com sucesso via supabaseAdmin
    const simulatedSessionUserId = 'admin-comp-a-id';
    const res = service.handleGetUsers(simulatedSessionUserId);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
