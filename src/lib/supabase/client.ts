import { createBrowserClient } from '@supabase/ssr';

// Get cookie domain for cross-subdomain auth
function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  // Use root domain for breathofnow.site to share cookies between www and app
  if (hostname.includes('breathofnow.site')) {
    return '.breathofnow.site';
  }
  return undefined; // Default behavior for localhost/other domains
}

export function createClient() {
  const cookieDomain = getCookieDomain();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: cookieDomain ? {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
        secure: true,
      } : undefined,
    }
  );
}
