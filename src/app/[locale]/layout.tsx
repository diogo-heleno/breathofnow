import '@/app/globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

export const metadata: Metadata = {
  title: {
    default: 'Breath of Now - Simple tools for mindful living',
    template: '%s | Breath of Now',
  },
  description: 'A collection of privacy-first micro-apps for expenses, investments, workouts, recipes, and more. Your data stays on your device.',
  keywords: ['expenses', 'investments', 'workouts', 'recipes', 'privacy', 'offline', 'micro-apps'],
  authors: [{ name: 'M21 Global', url: 'https://www.m21global.com' }],
  creator: 'M21 Global',
  publisher: 'M21 Global',
  metadataBase: new URL('https://breathofnow.site'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://breathofnow.site',
    siteName: 'Breath of Now',
    title: 'Breath of Now - Simple tools for mindful living',
    description: 'A collection of privacy-first micro-apps for expenses, investments, workouts, recipes, and more.',
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
    title: 'Breath of Now - Simple tools for mindful living',
    description: 'A collection of privacy-first micro-apps for expenses, investments, workouts, recipes, and more.',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* PWA meta tags */}
        <meta name="theme-color" content="#7c9a75" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Breath of Now" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-950 antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
