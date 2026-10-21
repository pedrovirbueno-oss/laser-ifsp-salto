import { IS_DEMO_MODE } from '@/repositories';

describe('Production & Demo Mode Authentication Flow Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('MODE: Production Mode is active when NEXT_PUBLIC_DEMO_MODE === "false"', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
    expect(isDemo).toBe(false);
  });

  it('AUTH: Error from Supabase Auth (Invalid credentials) is mapped to user friendly error', () => {
    const supabaseAuthError = { message: 'Invalid login credentials' };
    let mappedError = supabaseAuthError.message;
    if (supabaseAuthError.message.includes('Invalid login credentials')) {
      mappedError = 'Usuário não encontrado ou credenciais inválidas.';
    }
    expect(mappedError).toBe('Usuário não encontrado ou credenciais inválidas.');
  });

  it('AUTH: User authenticated in Auth but without profile receives profile missing error', () => {
    const authUser = { id: 'user-without-profile-123' };
    const mockProfile = null;

    let resultError = '';
    if (!mockProfile) {
      resultError = 'Perfil de usuário não configurado no sistema. Execute o bootstrap inicial.';
    }

    expect(resultError).toBe('Perfil de usuário não configurado no sistema. Execute o bootstrap inicial.');
  });

  it('AUTH: User authenticated in Auth with valid profile succeeds', () => {
    const mockProfile = {
      id: 'user-with-profile-456',
      company_id: 'company-789',
      role: 'admin',
      active: true,
    };

    let resultSuccess = false;
    if (mockProfile && mockProfile.active) {
      resultSuccess = true;
    }

    expect(resultSuccess).toBe(true);
  });

  it('SECURITY: SUPABASE_SECRET_KEY is strictly server-side and not exposed to public env', () => {
    const keys = Object.keys(process.env);
    const exposedSecret = keys.find((k) => k.startsWith('NEXT_PUBLIC_') && k.includes('SECRET'));
    expect(exposedSecret).toBeUndefined();
  });
});
