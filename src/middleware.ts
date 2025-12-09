import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

// Routes that belong to the website (www subdomain)
const WEBSITE_ROUTES = ['/', '/pricing', '/faq', '/privacy', '/terms'];

// Routes that belong to the app subdomain
const APP_ROUTE_PREFIXES = ['/expenses', '/investments', '/fitlog', '/recipes', '/dashboard'];

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

function isSharedRoute(path: string): boolean {
  return SHARED_ROUTES.some(prefix => path.startsWith(prefix));
}

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = getSubdomain(host);
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  // Get country from Vercel's geo headers
  const country = request.geo?.country || 'PT';

  // Subdomain routing logic
  if (subdomain) {
    // Skip shared routes
    if (!isSharedRoute(pathWithoutLocale)) {
      if (subdomain === 'www' && isAppRoute(pathWithoutLocale)) {
        // Redirect app routes from www to app subdomain
        const appUrl = new URL(request.url);
        appUrl.host = host.replace('www.', 'app.');
        return NextResponse.redirect(appUrl);
      }

      if (subdomain === 'app' && isWebsiteRoute(pathWithoutLocale)) {
        // Redirect website routes from app to www subdomain
        const wwwUrl = new URL(request.url);
        wwwUrl.host = host.replace('app.', 'www.');
        return NextResponse.redirect(wwwUrl);
      }

      // On app subdomain, redirect root to /expenses (main app)
      if (subdomain === 'app' && pathWithoutLocale === '/') {
        const expensesUrl = new URL(request.url);
        expensesUrl.pathname = '/expenses';
        return NextResponse.redirect(expensesUrl);
      }
    }
  }

  // Continue with i18n middleware
  const response = intlMiddleware(request);

  // Store country in a cookie for client-side access
  response.cookies.set('user-country', country, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
