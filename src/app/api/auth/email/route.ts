import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
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

/**
 * Verify Supabase webhook signature
 * Supabase uses HMAC-SHA256 to sign webhook payloads
 */
async function verifySupabaseSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    // Extract the actual secret from v1,whsec_xxx format
    const secretParts = secret.split(',');
    const actualSecret = secretParts.length > 1
      ? secretParts[1].replace('whsec_', '')
      : secret;

    // Compute expected signature
    const hmac = createHmac('sha256', actualSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Parse the signature header (format: t=timestamp,v1=signature)
    const signatureParts = signature.split(',');
    let receivedSignature = '';

    for (const part of signatureParts) {
      if (part.startsWith('v1=')) {
        receivedSignature = part.substring(3);
        break;
      }
    }

    if (!receivedSignature) {
      // If no v1= prefix, assume the whole string is the signature
      receivedSignature = signature;
    }

    // Use timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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
    const webhookSecret = process.env.SUPABASE_AUTH_WEBHOOK_SECRET;

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('x-supabase-signature');
      const isValid = await verifySupabaseSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Unauthorized - Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the payload
    const payload: SupabaseAuthEmailPayload = JSON.parse(rawBody);
    const { type, email, token, redirect_to } = payload;

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'auth-email' });
}
