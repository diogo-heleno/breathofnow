import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

// Routes that belong to the website (www subdomain)
const WEBSITE_ROUTES = ['/', '/pricing', '/faq', '/privacy', '/terms'];

// Routes that belong to the app subdomain and REQUIRE authentication
const PROTECTED_APP_ROUTES = ['/expenses', '/investments', '/fitlog', '/recipes', '/dashboard', '/account'];

// Routes that belong to the app subdomain
const APP_ROUTE_PREFIXES = ['/expenses', '/investments', '/fitlog', '/recipes', '/dashboard', '/account'];

// Shared routes (available on both subdomains)
const SHARED_ROUTES = ['/auth'];

function getSubdomain(host: string): 'www' | 'app' | null {
  // Handle localhost for development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return null; // Allow all routes in development
  }

  // Handle Vercel preview deployments
  if (host.includes('vercel.app')) {
    return null; // Allow all routes on preview
  }

  if (host.startsWith('www.')) {
    return 'www';
  }

  if (host.startsWith('app.')) {
    return 'app';
  }

  // Root domain (breathofnow.site) - treat as www
  return 'www';
}

function getPathWithoutLocale(pathname: string): string {
  // Remove locale prefix if present (e.g., /en/expenses -> /expenses)
  const localePattern = new RegExp(`^/(${locales.join('|')})`);
  return pathname.replace(localePattern, '') || '/';
}

function isWebsiteRoute(path: string): boolean {
  return WEBSITE_ROUTES.includes(path);
}

function isAppRoute(path: string): boolean {
  return APP_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
}

function isProtectedRoute(path: string): boolean {
  return PROTECTED_APP_ROUTES.some(prefix => path.startsWith(prefix));
}

function isSharedRoute(path: string): boolean {
  return SHARED_ROUTES.some(prefix => path.startsWith(prefix));
}

// Get cookie domain for cross-subdomain auth
function getCookieDomain(host: string): string | undefined {
  if (host.includes('breathofnow.site')) {
    return '.breathofnow.site';
  }
  return undefined;
}

export default async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = getSubdomain(host);
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const cookieDomain = getCookieDomain(host);

  // Get country from Vercel's geo headers
  const country = request.geo?.country || 'PT';

  // Handle auth code on any page - redirect to callback route
  // This catches magic links that redirect to wrong URL (e.g., homepage with ?code=)
  const code = request.nextUrl.searchParams.get('code');
  if (code && !pathWithoutLocale.startsWith('/auth/callback')) {
    // Extract locale from pathname if present, fallback to cookie or defaultLocale (en)
    const localeMatch = pathname.match(/^\/(en|pt|es|fr)/);
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = localeMatch ? localeMatch[1] : (cookieLocale || defaultLocale);

    // Redirect to app subdomain callback route
    const isProduction = host.includes('breathofnow.site');
    const callbackUrl = isProduction
      ? `https://app.breathofnow.site/${locale}/auth/callback?code=${code}`
      : `${request.nextUrl.origin}/${locale}/auth/callback?code=${code}`;

    return NextResponse.redirect(callbackUrl);
  }

  // Subdomain routing logic
  if (subdomain) {
    // Skip shared routes
    if (!isSharedRoute(pathWithoutLocale)) {
      if (subdomain === 'www' && isAppRoute(pathWithoutLocale)) {
        // Redirect app routes from www/root to app subdomain
        const appUrl = new URL(request.url);
        // Handle both www.domain and bare domain
        if (host.startsWith('www.')) {
          appUrl.host = host.replace('www.', 'app.');
        } else {
          appUrl.host = 'app.' + host;
        }
        return NextResponse.redirect(appUrl);
      }

      if (subdomain === 'app' && isWebsiteRoute(pathWithoutLocale) && pathWithoutLocale !== '/') {
        // Redirect website routes from app to www subdomain (except root, which goes to /account)
        const wwwUrl = new URL(request.url);
        wwwUrl.host = host.replace('app.', 'www.');
        return NextResponse.redirect(wwwUrl);
      }

      // On app subdomain, redirect root to /account (app selection)
      if (subdomain === 'app' && pathWithoutLocale === '/') {
        const accountUrl = new URL(request.url);
        accountUrl.pathname = '/account';
        return NextResponse.redirect(accountUrl);
      }
    }
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathWithoutLocale)) {
    // Skip auth check if Supabase is not configured (development without env vars)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // In development without Supabase, allow access to protected routes
      const response = intlMiddleware(request);

      // Store country in a cookie for client-side access
      response.cookies.set('user-country', country, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        ...(cookieDomain && { domain: cookieDomain }),
      });

      return response;
    }

    // Create Supabase client for middleware
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            const enhancedOptions = cookieDomain
              ? { ...options, domain: cookieDomain }
              : options;
            response.cookies.set({
              name,
              value,
              ...enhancedOptions,
            });
          },
          remove(name: string, options: CookieOptions) {
            const enhancedOptions = cookieDomain
              ? { ...options, domain: cookieDomain }
              : options;
            response.cookies.set({
              name,
              value: '',
              ...enhancedOptions,
            });
          },
        },
      }
    );

    // Get the session
    const { data: { session } } = await supabase.auth.getSession();

    // If no session, redirect to sign in
    if (!session) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // User is authenticated, continue with i18n middleware
    const intlResponse = intlMiddleware(request);

    // Copy cookies from supabase response to intl response
    response.cookies.getAll().forEach(cookie => {
      intlResponse.cookies.set(cookie);
    });

    // Store country in a cookie for client-side access
    intlResponse.cookies.set('user-country', country, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      ...(cookieDomain && { domain: cookieDomain }),
    });

    // Ensure NEXT_LOCALE cookie is set to persist locale preference
    const localeFromPath = pathname.match(/^\/(en|pt|es|fr)/)?.[1];
    const existingLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const currentLocale = localeFromPath || defaultLocale;

    if (currentLocale !== existingLocale) {
      intlResponse.cookies.set('NEXT_LOCALE', currentLocale, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        ...(cookieDomain && { domain: cookieDomain }),
      });
    }

    return intlResponse;
  }

  // Continue with i18n middleware for non-protected routes
  const response = intlMiddleware(request);

  // Store country in a cookie for client-side access
  response.cookies.set('user-country', country, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    ...(cookieDomain && { domain: cookieDomain }),
  });

  // Ensure NEXT_LOCALE cookie is set to persist locale preference
  // This works across www and app subdomains when cookieDomain is set
  const localeFromPath = pathname.match(/^\/(en|pt|es|fr)/)?.[1];
  const existingLocale = request.cookies.get('NEXT_LOCALE')?.value;

  // Determine the current locale: from path, or default if path has no locale prefix
  const currentLocale = localeFromPath || defaultLocale;

  // Update cookie if locale changed or doesn't exist
  if (currentLocale !== existingLocale) {
    response.cookies.set('NEXT_LOCALE', currentLocale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      ...(cookieDomain && { domain: cookieDomain }),
    });
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
