'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export default function SignInPage({ params: { locale } }: PageProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use app subdomain for callback in production to ensure cookies are set correctly
  const getCallbackUrl = () => {
    if (typeof window === 'undefined') return '';
    const isProduction = window.location.hostname.includes('breathofnow.site');
    return isProduction
      ? `https://app.breathofnow.site/${locale}/auth/callback`
      : `${window.location.origin}/${locale}/auth/callback`;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getCallbackUrl(),
        },
      });

      if (error) throw error;
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getCallbackUrl(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      // Redirect to account on success
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('otpError'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getCallbackUrl(),
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <Logo size="lg" className="justify-center" />
            </Link>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {t('magicLinkTitle')}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {t('magicLinkSent', { email })}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* OTP Code Input */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    {t('otpInstructions')}
                  </p>
                  <Input
                    type="text"
                    label={t('otpLabel')}
                    placeholder={t('otpPlaceholder')}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isVerifying}
                  disabled={otpCode.length < 6}
                >
                  {t('verifyCode')}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500">
                    {t('orClickLink')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-neutral-500 text-center mb-4">
                {t('magicLinkDescription')}
              </p>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="w-full text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
              >
                {isLoading ? t('resending') : t('resendCode')}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Logo size="lg" className="justify-center" />
          </Link>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('signInTitle')}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                {t('signInSubtitle')}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <Input
                type="email"
                label={t('emailLabel')}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('sendMagicLink')}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => handleOAuthSignIn('google')}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => handleOAuthSignIn('github')}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </Button>
            </div>

            {/* Sign up link */}
            <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
              {t('noAccount')}{' '}
              <Link
                href="/auth/signup"
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                {t('signUp')}
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          {t('termsAgree')}{' '}
          <Link href="/terms" className="underline hover:text-neutral-700">
            {t('termsLink')}
          </Link>{' '}
          &{' '}
          <Link href="/privacy" className="underline hover:text-neutral-700">
            {t('privacyLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
