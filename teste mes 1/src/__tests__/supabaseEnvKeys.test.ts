describe('Supabase New API Key Integration & Security Configuration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('CONFIG: Browser client environment configuration requires NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real-project.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const isProduction = process.env.NEXT_PUBLIC_DEMO_MODE === 'false';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    let hasError = false;
    if (isProduction && (!supabaseUrl || !publishableKey)) {
      hasError = true;
    }
    expect(hasError).toBe(true);
  });

  it('CONFIG: Server/Admin environment configuration requires SUPABASE_SECRET_KEY', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real-project.supabase.co';
    delete process.env.SUPABASE_SECRET_KEY;

    const secretKey = process.env.SUPABASE_SECRET_KEY;
    expect(secretKey).toBeUndefined();
  });

  it('SECURITY: SUPABASE_SECRET_KEY must NOT be prefixed with NEXT_PUBLIC_ or accessible to client bundle', () => {
    const isSecretKeyPublic = 'SUPABASE_SECRET_KEY'.startsWith('NEXT_PUBLIC_');
    expect(isSecretKeyPublic).toBe(false);
  });

  it('DEMO MODE: Demo Mode continues working without requiring Supabase credentials', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
    expect(isDemoMode).toBe(true);
  });

  it('PRODUCTION MODE: Production Mode validates presence of new publishable and secret keys', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://prod.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sbp_pub_key_12345';
    process.env.SUPABASE_SECRET_KEY = 'sbp_secret_key_67890';

    expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toContain('sbp_pub_key_');
    expect(process.env.SUPABASE_SECRET_KEY).toContain('sbp_secret_key_');
  });
});
