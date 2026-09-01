import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * SARIRO — Middleware (a.k.a. proxy in Next.js 16+)
 * 
 * Two jobs:
 * 1. Gate /dashboard/* and /settings — redirect to /auth/sign-in?next=... if no session
 * 2. Redirect / to /dashboard if user is logged in (the "professional" pattern)
 * 
 * Public routes (no auth required, accessible to all):
 *   /, /courses, /schools, /events, /pricing, /about, /story,
 *   /resources, /faq, /contact, /checkout, /course-path, /privacy,
 *   /refunds, /terms, /auth/sign-in, /auth/sign-up
 * 
 * Dashboard routes (auth required):
 *   /dashboard, /dashboard/*, /settings
 * 
 * Gracefully degrades: if Supabase env vars are missing, the middleware
 * becomes a no-op (lets everything through) so the site still loads
 * for development/preview without real credentials.
 */

const PUBLIC_PATHS = [
  '/',
  '/courses',
  '/events',
  '/pricing',
  '/about',
  '/story',
  '/resources',
  '/faq',
  '/contact',
  '/checkout',
  '/course-path',
  '/privacy',
  '/refunds',
  '/terms',
  '/auth/sign-in',
  '/auth/sign-up',
];

const AUTH_PATHS = ['/auth/sign-in', '/auth/sign-up'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/course-path/')) return true;
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/')) return true;
  if (pathname.includes('.')) return true;
  return false;
}

function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/settings';
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname);
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!key && url.startsWith('http') && !url.includes('PUT_YOUR');
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // If Supabase isn't configured, no-op the middleware (dev/preview mode)
  if (!isSupabaseConfigured()) {
    return res;
  }

  // Build a Supabase client that reads the session from cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  // 1. Redirect / → /dashboard if logged in (professional pattern)
  if (pathname === '/' && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 2. Gate dashboard routes
  if (isDashboardPath(pathname) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // 3. If logged in and visiting /auth/sign-in or /auth/sign-up, redirect to /dashboard
  if (isAuthPath(pathname) && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - api routes (handled separately)
     * - favicon, robots, sitemap, logo (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|logo.svg|images/|videos/).*)',
  ],
};
