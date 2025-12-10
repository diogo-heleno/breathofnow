import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Wifi, WifiOff, Cloud, Download, Zap, RefreshCw, ArrowRight, Check, Smartphone } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { locales, type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: 'Works Offline - Breath of Now',
    description: 'No internet? No problem. All apps work fully offline with optional cloud sync.',
  };
}

export default function WorksOfflinePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const features = [
    {
      icon: WifiOff,
      title: 'True Offline Mode',
      description: 'All core features work without any internet connection. Track expenses on a flight, log workouts in the mountains.',
    },
    {
      icon: Zap,
      title: 'Instant Response',
      description: 'No network latency. Your data is right there on your device, ready in milliseconds.',
    },
    {
      icon: Download,
      title: 'Progressive Web App',
      description: 'Install on your home screen like a native app. Works seamlessly across all devices.',
    },
    {
      icon: RefreshCw,
      title: 'Smart Sync',
      description: 'When you\'re back online, changes sync automatically. No manual intervention needed.',
    },
    {
      icon: Cloud,
      title: 'Optional Cloud Backup',
      description: 'Premium users can enable cloud sync for cross-device access while keeping offline functionality.',
    },
    {
      icon: Smartphone,
      title: 'Works Everywhere',
      description: 'From remote beaches to subway tunnels—your apps work wherever you are.',
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-8">
                <Wifi className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                Works Offline
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                No internet? No problem. All apps work fully offline with optional cloud sync.
                Your productivity doesn't depend on a connection.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/auth/signup`}>
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link href="https://www.breathofnow.site/#apps">
                  <Button variant="outline" size="lg">
                    Explore Apps
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Always Available
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Built from the ground up to work offline, not as an afterthought
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  How Offline Mode Works
                </h2>
              </div>

              <div className="space-y-8">
                {[
                  {
                    step: '1',
                    title: 'Data Stored Locally',
                    description: 'All your data is stored in IndexedDB, a powerful browser database that persists even when offline.',
                    icon: Download,
                  },
                  {
                    step: '2',
                    title: 'Service Worker Magic',
                    description: 'Our service worker caches the app so it loads instantly, even without network access.',
                    icon: Zap,
                  },
                  {
                    step: '3',
                    title: 'Queue Changes',
                    description: 'When offline, any changes you make are queued and ready to sync when you reconnect.',
                    icon: RefreshCw,
                  },
                  {
                    step: '4',
                    title: 'Automatic Sync',
                    description: 'Back online? Changes sync automatically in the background. No manual steps required.',
                    icon: Cloud,
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex gap-6 items-start">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {item.description}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        <Icon className="w-6 h-6 text-neutral-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Perfect For
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { emoji: '✈️', title: 'Traveling', desc: 'Track expenses during flights and in areas without coverage' },
                  { emoji: '🏔️', title: 'Outdoor Activities', desc: 'Log workouts in remote hiking trails or mountains' },
                  { emoji: '🚇', title: 'Commuting', desc: 'Use apps in subway tunnels with no signal' },
                  { emoji: '💼', title: 'International Travel', desc: 'No need for expensive roaming data' },
                  { emoji: '🏠', title: 'Poor Connectivity', desc: 'Works perfectly in areas with spotty internet' },
                  { emoji: '⚡', title: 'Speed Matters', desc: 'Zero latency for instant responsiveness' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600 dark:bg-blue-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                Never Depend on a Connection Again
              </h2>
              <p className="text-lg text-blue-100 mb-8">
                Start using apps that respect your independence. Work anywhere, anytime.
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
