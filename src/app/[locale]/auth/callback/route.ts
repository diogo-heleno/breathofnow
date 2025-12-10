import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/expenses';
  const nameFromUrl = requestUrl.searchParams.get('name');
  const locale = params.locale;

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData.user) {
      const user = sessionData.user;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If no profile exists, create one
      if (!existingProfile) {
        // Get name from URL param, user metadata, or email
        const fullName = nameFromUrl ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User';

        // Check if this email should get premium access
        const { data: premiumEmail } = await supabase
          .from('premium_emails')
          .select('tier')
          .eq('email', user.email)
          .single();

        // Create profile with free tier (or premium if email is whitelisted)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: user.user_metadata?.avatar_url || null,
            subscription_tier: premiumEmail?.tier || 'free',
            is_founding_member: premiumEmail?.tier === 'founding',
            selected_apps: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      // Redirect to the app subdomain after successful auth (with locale)
      const appUrl = process.env.NODE_ENV === 'production'
        ? `https://app.breathofnow.site/${locale}${next}`
        : `${requestUrl.origin}/${locale}${next}`;

      return NextResponse.redirect(appUrl);
    }
  }

  // Return the user to an error page if something went wrong
  return NextResponse.redirect(`${requestUrl.origin}/${locale}/auth/signin?error=callback`);
}
