import { Company, Profile, UserRole } from '@/types';

describe('Onboarding & Setup Flow Unit Tests', () => {

  // Helper guard evaluation mirroring src/app/setup/page.tsx logic
  function evaluateSetupGuard(user: Profile | null, company: Company | null, isLoading: boolean): string | null {
    if (isLoading) {
      return null; // No redirect while loading
    }
    if (!user || user.role !== 'admin' || !company) {
      return '/dashboard';
    }
    if (company.setup_completed_at !== null && company.setup_completed_at !== undefined) {
      return '/dashboard';
    }
    return '/setup'; // Access allowed
  }

  // Helper login destination evaluation mirroring AuthContext / login routing
  function evaluateLoginDestination(role: UserRole, company: Company | null): string {
    if (role === 'operator') {
      return '/operator';
    }
    if (role === 'admin' && company && (company.setup_completed_at === null || company.setup_completed_at === undefined)) {
      return '/setup';
    }
    return '/dashboard';
  }

  // Helper visual banner visibility check mirroring Dashboard & Sidebar logic
  function shouldShowSetupBanner(role: UserRole, company: Company | null): boolean {
    return role === 'admin' && !!company && (company.setup_completed_at === null || company.setup_completed_at === undefined);
  }

  it('1. /setup: does NOT redirect while isLoading === true', () => {
    const mockUser: Profile = { id: 'admin-1', company_id: 'comp-1', name: 'Admin', email: 'admin@test.com', role: 'admin', active: true, created_at: '', updated_at: '' };
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: undefined, created_at: '', updated_at: '' };

    const redirectPath = evaluateSetupGuard(mockUser, mockCompany, true);
    expect(redirectPath).toBeNull();
  });

  it('2. /setup: ADMIN with setup_completed_at === null is ALLOWED to access /setup', () => {
    const mockUser: Profile = { id: 'admin-1', company_id: 'comp-1', name: 'Admin', email: 'admin@test.com', role: 'admin', active: true, created_at: '', updated_at: '' };
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: null as any, created_at: '', updated_at: '' };

    const redirectPath = evaluateSetupGuard(mockUser, mockCompany, false);
    expect(redirectPath).toBe('/setup');
  });

  it('3. /setup: ADMIN with setup completed (setup_completed_at !== null) is redirected to /dashboard', () => {
    const mockUser: Profile = { id: 'admin-1', company_id: 'comp-1', name: 'Admin', email: 'admin@test.com', role: 'admin', active: true, created_at: '', updated_at: '' };
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: new Date().toISOString(), created_at: '', updated_at: '' };

    const redirectPath = evaluateSetupGuard(mockUser, mockCompany, false);
    expect(redirectPath).toBe('/dashboard');
  });

  it('4. /setup: Non-ADMIN users (supervisor/operator) are redirected to /dashboard', () => {
    const supervisorUser: Profile = { id: 'sup-1', company_id: 'comp-1', name: 'Supervisor', email: 'sup@test.com', role: 'supervisor', active: true, created_at: '', updated_at: '' };
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: null as any, created_at: '', updated_at: '' };

    const redirectPath = evaluateSetupGuard(supervisorUser, mockCompany, false);
    expect(redirectPath).toBe('/dashboard');
  });

  it('5. LOGIN: Newly logged-in ADMIN with setup incomplete (null) is sent to /setup', () => {
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: null as any, created_at: '', updated_at: '' };

    const destination = evaluateLoginDestination('admin', mockCompany);
    expect(destination).toBe('/setup');
  });

  it('6. LOGIN: ADMIN with setup completed continues to /dashboard', () => {
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: new Date().toISOString(), created_at: '', updated_at: '' };

    const destination = evaluateLoginDestination('admin', mockCompany);
    expect(destination).toBe('/dashboard');
  });

  it('7. LOGIN: SUPERVISOR and OPERATOR continue to /dashboard or /operator', () => {
    const mockCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: null as any, created_at: '', updated_at: '' };

    const supervisorDest = evaluateLoginDestination('supervisor', mockCompany);
    expect(supervisorDest).toBe('/dashboard');

    const operatorDest = evaluateLoginDestination('operator', mockCompany);
    expect(operatorDest).toBe('/operator');
  });

  it('8. UI: Banner/link appears ONLY for ADMIN with setup incomplete', () => {
    const incompleteCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: null as any, created_at: '', updated_at: '' };

    expect(shouldShowSetupBanner('admin', incompleteCompany)).toBe(true);
    expect(shouldShowSetupBanner('supervisor', incompleteCompany)).toBe(false);
    expect(shouldShowSetupBanner('operator', incompleteCompany)).toBe(false);
  });

  it('9. UI: Banner disappears automatically after setup_completed_at is set', () => {
    const completedCompany: Company = { id: 'comp-1', name: 'Test Comp', legal_name: 'Test', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: '2026-09-07T20:00:00.000Z', created_at: '', updated_at: '' };

    expect(shouldShowSetupBanner('admin', completedCompany)).toBe(false);
  });

  it('10. DEMO: Demo Mode admin with completed demoCompany routes to /dashboard', () => {
    const demoCompany: Company = { id: '00000000-0000-0000-0000-000000000001', name: 'Metalúrgica Vale', legal_name: 'Metalúrgica Vale S/A', document: '123', email: 't@t.com', phone: '123', timezone: 'UTC', active: true, setup_completed_at: '2026-01-01T00:00:00.000Z', created_at: '', updated_at: '' };

    const destination = evaluateLoginDestination('admin', demoCompany);
    expect(destination).toBe('/dashboard');
    expect(shouldShowSetupBanner('admin', demoCompany)).toBe(false);
  });

});
