import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

// Get cookie domain based on request host
function getCookieDomain(): string | undefined {
  try {
    const headersList = headers();
    const host = headersList.get('host') || '';
    // Use root domain for breathofnow.site to share cookies between www and app
    if (host.includes('breathofnow.site')) {
      return '.breathofnow.site';
    }
  } catch {
    // headers() may not be available in some contexts
  }
  return undefined; // Default behavior for localhost/other domains
}

export function createClient() {
  const cookieStore = cookies();
  const cookieDomain = getCookieDomain();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const enhancedOptions = cookieDomain
              ? { ...options, domain: cookieDomain }
              : options;
            cookieStore.set({ name, value, ...enhancedOptions });
          } catch (error) {
            // Handle cookies in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const enhancedOptions = cookieDomain
              ? { ...options, domain: cookieDomain }
              : options;
            cookieStore.set({ name, value: '', ...enhancedOptions });
          } catch (error) {
            // Handle cookies in Server Components
          }
        },
      },
    }
  );
}
