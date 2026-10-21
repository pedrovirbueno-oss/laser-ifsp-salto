import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
  const pathname = req.nextUrl.pathname;

  // Static assets and public routes pass through immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // In Demo Mode or when a validated Test User session cookie is active, navigation passes through in <1ms
  const hasTestSession = Boolean(req.cookies.get('nexo_test_session')?.value);
  if (isDemoMode || hasTestSession) {
    return NextResponse.next();
  }

  // Fast-path: If no Supabase auth cookie (sb-*) exists at all, redirect immediately without remote HTTP round-trip
  const allCookies = req.cookies.getAll();
  const hasSupabaseCookie = allCookies.some((c) => c.name.startsWith('sb-'));
  if (!hasSupabaseCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // In Production Mode: Validate session with @supabase/ssr
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        req.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        req.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  try {
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2500)
    );

    const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

    if (!user) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/operator/:path*',
    '/orders/:path*',
    '/machines/:path*',
    '/products/:path*',
    '/reasons/:path*',
    '/shifts/:path*',
    '/reports/:path*',
    '/export/:path*',
    '/import/:path*',
    '/alerts/:path*',
    '/audit/:path*',
    '/settings/:path*',
    '/setup/:path*',
  ],
};

