import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Fraunces, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import '../globals.css';
import { Suspense } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { ConnectivityStatus } from '@/components/pwa/connectivity-status';
import { UncachedPageBanner } from '@/components/pwa/uncached-page-banner';
import { OfflineNavigationHandler } from '@/components/pwa/offline-navigation-handler';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://breathofnow.site'),
  title: {
    default: 'Breath of Now - Privacy-First Micro-Apps for Conscious Living',
    template: '%s | Breath of Now',
  },
  description:
    'Your data, your device, your control. Track expenses, investments, fitness, recipes and more with beautiful privacy-first apps that work offline.',
  keywords: [
    'expense tracker',
    'investment tracker',
    'fitness log',
    'recipe manager',
    'privacy-first',
    'offline-first',
    'local-first',
    'personal finance',
    'conscious living',
  ],
  authors: [{ name: 'M21 Global, Lda' }],
  creator: 'M21 Global, Lda',
  publisher: 'M21 Global, Lda',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Breath of Now',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://breathofnow.site',
    siteName: 'Breath of Now',
    title: 'Breath of Now - Privacy-First Micro-Apps',
    description:
      'Your data, your device, your control. Beautiful privacy-first apps for conscious living.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Breath of Now',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Breath of Now - Privacy-First Micro-Apps',
    description:
      'Your data, your device, your control. Beautiful privacy-first apps for conscious living.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5a7d5a' },
    { media: '(prefers-color-scheme: dark)', color: '#5a7d5a' },
  ],
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Breath of Now" />
        <meta name="apple-mobile-web-app-title" content="Breath of Now" />
        <meta name="theme-color" content="#5a7d5a" />
        <meta name="msapplication-navbutton-color" content="#5a7d5a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-starturl" content="/" />

        {/* App Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#5a7d5a" />

        {/* MS Tile Icons */}
        <meta name="msapplication-TileColor" content="#5a7d5a" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body
        className={`${fraunces.variable} ${sourceSans.variable} ${jetbrainsMono.variable} font-body antialiased bg-warm-50 text-warm-900`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
          
          {/* PWA Components */}
          <OfflineNavigationHandler />
          <ConnectivityStatus />
          <Suspense fallback={null}>
            <UncachedPageBanner />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
