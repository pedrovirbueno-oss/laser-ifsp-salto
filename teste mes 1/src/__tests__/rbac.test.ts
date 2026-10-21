import { UserRole, Profile } from '../types';

function canAccessRoute(role: UserRole, route: string): boolean {
  const adminOnlyRoutes = ['/settings', '/audit', '/import', '/products', '/reasons', '/shifts', '/setup'];
  const adminSupervisorRoutes = ['/reports', '/export', '/orders', '/machines', '/dashboard', '/alerts'];
  const allRolesRoutes = ['/operator'];

  if (adminOnlyRoutes.includes(route)) {
    return role === 'admin';
  }
  if (adminSupervisorRoutes.includes(route)) {
    return role === 'admin' || role === 'supervisor';
  }
  if (allRolesRoutes.includes(route)) {
    return true;
  }
  return false;
}

function validateProfileUpdate(
  requestorRole: UserRole,
  requestorCompanyId: string,
  targetProfile: Profile,
  updates: Partial<Profile>
): boolean {
  // REJECT cross-tenant access/edits
  if (targetProfile.company_id !== requestorCompanyId) {
    return false;
  }
  // REJECT changing company_id
  if (updates.company_id && updates.company_id !== targetProfile.company_id) {
    return false;
  }
  // OPERATOR cannot alter any role or profile
  if (requestorRole === 'operator') {
    return false;
  }
  // SUPERVISOR cannot promote to ADMIN or edit ADMIN profiles
  if (requestorRole === 'supervisor') {
    if (updates.role === 'admin' || targetProfile.role === 'admin') {
      return false;
    }
  }
  return true;
}

describe('Role-Based Access Control (RBAC) & Profile Self-Promotion Defense Tests', () => {
  const operatorProfile: Profile = {
    id: 'op-1',
    company_id: 'c-1',
    name: 'João Operador',
    email: 'operador@test.com',
    role: 'operator',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supervisorProfile: Profile = {
    id: 'sup-1',
    company_id: 'c-1',
    name: 'Maria Supervisora',
    email: 'super@test.com',
    role: 'supervisor',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('should allow ADMIN to access all administrative routes', () => {
    expect(canAccessRoute('admin', '/settings')).toBe(true);
    expect(canAccessRoute('admin', '/audit')).toBe(true);
    expect(canAccessRoute('admin', '/setup')).toBe(true);
    expect(canAccessRoute('admin', '/dashboard')).toBe(true);
  });

  it('should DENY OPERATOR from accessing administrative routes', () => {
    expect(canAccessRoute('operator', '/settings')).toBe(false);
    expect(canAccessRoute('operator', '/audit')).toBe(false);
    expect(canAccessRoute('operator', '/setup')).toBe(false);
    expect(canAccessRoute('operator', '/dashboard')).toBe(false);
  });

  it('REJECT: OPERATOR tentando alterar role -> REJECT', () => {
    const allowed = validateProfileUpdate('operator', 'c-1', operatorProfile, { role: 'admin' });
    expect(allowed).toBe(false);
  });

  it('REJECT: OPERATOR tentando alterar company_id -> REJECT', () => {
    const allowed = validateProfileUpdate('operator', 'c-1', operatorProfile, { company_id: 'c-2' });
    expect(allowed).toBe(false);
  });

  it('REJECT: SUPERVISOR tentando promover usuário para ADMIN -> REJECT', () => {
    const targetUser: Profile = {
      id: 'op-2',
      company_id: 'c-1',
      name: 'Carlos Operador',
      email: 'carlos@test.com',
      role: 'operator',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const allowed = validateProfileUpdate('supervisor', 'c-1', targetUser, { role: 'admin' });
    expect(allowed).toBe(false);
  });

  it('REJECT: usuário de Empresa A tentando acessar/alterar dados da Empresa B -> REJECT', () => {
    const companyBProfile: Profile = {
      id: 'user-b',
      company_id: 'company-b',
      name: 'User B',
      email: 'userb@test.com',
      role: 'operator',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allowed = validateProfileUpdate('admin', 'company-a', companyBProfile, { name: 'Unauthorized Change' });
    expect(allowed).toBe(false);
  });
});
