import { NextRequest, NextResponse } from 'next/server';
import { resend, EMAIL_FROM } from '@/lib/resend/client';
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
    // Verify the webhook secret
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.SUPABASE_AUTH_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error('Invalid webhook authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: SupabaseAuthEmailPayload = await request.json();
    const { type, email, token, redirect_to } = payload;

    // Extract locale from redirect_to URL or default to 'en'
    let locale: Locale = 'en';
    if (redirect_to) {
      const url = new URL(redirect_to);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && isValidLocale(pathParts[0])) {
        locale = pathParts[0];
      }
    }

    // Determine email type for our template
    const emailType: 'signin' | 'signup' = type === 'signup' ? 'signup' : 'signin';

    // Build the magic link URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.breathofnow.site';
    const magicLink = `${siteUrl}/${locale}/auth/callback?token_hash=${payload.token_hash}&type=${type}`;

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'auth-email' });
}
