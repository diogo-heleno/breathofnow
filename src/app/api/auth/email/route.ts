import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, EMAIL_FROM } from '@/lib/resend/client';
import { AuthOtpEmail } from '@/emails/auth-otp';
import { render } from '@react-email/components';

type Locale = 'en' | 'pt' | 'pt-BR' | 'es' | 'fr';

const validLocales: Locale[] = ['en', 'pt', 'pt-BR', 'es', 'fr'];

function isValidLocale(locale: string): locale is Locale {
  return validLocales.includes(locale as Locale);
}

interface SupabaseAuthEmailPayload {
  type: 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change';
  email: string;
  token: string;
  token_hash: string;
  redirect_to: string;
  site_url: string;
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
  };
}

function getSubjectByLocale(locale: Locale, type: 'signin' | 'signup'): string {
  const subjects: Record<Locale, { signin: string; signup: string }> = {
    en: {
      signin: 'Sign in to Breath of Now',
      signup: 'Welcome to Breath of Now - Verify your email',
    },
    pt: {
      signin: 'Iniciar sessão em Breath of Now',
      signup: 'Bem-vindo ao Breath of Now - Verifique o seu email',
    },
    'pt-BR': {
      signin: 'Entrar no Breath of Now',
      signup: 'Bem-vindo ao Breath of Now - Verifique seu email',
    },
    es: {
      signin: 'Iniciar sesión en Breath of Now',
      signup: 'Bienvenido a Breath of Now - Verifica tu email',
    },
    fr: {
      signin: 'Connexion à Breath of Now',
      signup: 'Bienvenue sur Breath of Now - Vérifiez votre email',
    },
  };

  return subjects[locale][type];
}

export async function POST(request: NextRequest) {
  try {
    // Log headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Webhook headers:', JSON.stringify(headers, null, 2));

    // Get raw body
    const rawBody = await request.text();
    console.log('Webhook payload received:', rawBody);

    // Parse the payload - Supabase wraps it in a different structure
    const rawPayload = JSON.parse(rawBody);
    console.log('Parsed payload structure:', JSON.stringify(rawPayload, null, 2));

    // Supabase Auth Hook sends data in a nested structure
    // The actual email data is in the payload
    const payload = rawPayload as SupabaseAuthEmailPayload;

    // Try different payload structures
    const email = payload.email || rawPayload.user?.email || rawPayload.email_data?.email;
    const token = payload.token || rawPayload.email_data?.token || rawPayload.token_hash;
    const type = payload.type || rawPayload.email_data?.email_action_type || 'magiclink';
    const redirect_to = payload.redirect_to || rawPayload.email_data?.redirect_to || '';
    const token_hash = payload.token_hash || rawPayload.email_data?.token_hash || '';

    console.log(`Processing ${type} email for ${email}, token: ${token ? 'present' : 'missing'}`);

    // Extract locale from redirect_to URL or default to 'en'
    let locale: Locale = 'en';
    if (redirect_to) {
      try {
        const url = new URL(redirect_to);
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0 && isValidLocale(pathParts[0])) {
          locale = pathParts[0];
        }
      } catch {
        // Invalid URL, use default locale
      }
    }

    console.log(`Detected locale: ${locale}`);

    // Determine email type for our template
    const emailType: 'signin' | 'signup' = type === 'signup' ? 'signup' : 'signin';

    // Validate required fields
    if (!email || !token) {
      console.error('Missing required fields - email:', email, 'token:', token ? 'present' : 'missing');
      return NextResponse.json(
        { error: 'Missing required fields', email: !!email, token: !!token },
        { status: 400 }
      );
    }

    // Build the magic link URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.breathofnow.site';
    const magicLink = `${siteUrl}/${locale}/auth/callback?token_hash=${token_hash}&type=${type}`;

    // Render the email HTML
    const emailHtml = await render(
      AuthOtpEmail({
        otpCode: token,
        magicLink,
        locale,
        type: emailType,
      })
    );

    // Send the email via Resend
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: getSubjectByLocale(locale, emailType),
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log(`Auth email sent successfully: ${data?.id} to ${email} (${locale})`);

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'auth-email',
    timestamp: new Date().toISOString()
  });
}
