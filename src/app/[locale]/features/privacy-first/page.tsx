import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Shield, Database, Lock, Eye, Server, Smartphone, ArrowRight, Check } from 'lucide-react';
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
    title: 'Privacy First - Breath of Now',
    description: 'Your data lives on your device. We can\'t see it, we can\'t sell it, we can\'t lose it.',
  };
}

export default function PrivacyFirstPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const features = [
    {
      icon: Database,
      title: 'Local-First Storage',
      description: 'All your data is stored locally in your browser\'s IndexedDB. No server uploads by default.',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'When you enable cloud sync, your data is encrypted before leaving your device.',
    },
    {
      icon: Eye,
      title: 'Zero Knowledge',
      description: 'We literally cannot see your data. Even with cloud sync enabled, we only store encrypted blobs.',
    },
    {
      icon: Server,
      title: 'No Third-Party Analytics',
      description: 'We don\'t use Google Analytics or any invasive tracking. Your usage stays private.',
    },
    {
      icon: Smartphone,
      title: 'Your Device, Your Control',
      description: 'Export your data anytime in standard formats. Delete everything with one click.',
    },
    {
      icon: Shield,
      title: 'GDPR Compliant',
      description: 'Built with European privacy standards in mind. Your rights are protected.',
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 mb-8">
                <Shield className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                Privacy First
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                Your data lives on your device. We can't see it, we can't sell it, we can't lose it. 
                This isn't just a feature—it's our fundamental principle.
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

        {/* How It Works Section */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                How We Protect Your Privacy
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Privacy isn't an afterthought—it's baked into our architecture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 mb-4">
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

        {/* Data Flow Diagram */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Where Your Data Lives
                </h2>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <Smartphone className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Your Device</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      All data stored locally in IndexedDB
                    </p>
                    <div className="mt-4 text-green-600 font-medium">100% Private</div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="hidden md:block">
                      <ArrowRight className="w-8 h-8 text-neutral-300" />
                    </div>
                    <div className="md:hidden">
                      <div className="w-px h-8 bg-neutral-300 mx-auto" />
                    </div>
                  </div>

                  <div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                      <Server className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Cloud (Optional)</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Encrypted sync for premium users only
                    </p>
                    <div className="mt-4 text-blue-600 font-medium">Encrypted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  We're Different
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { us: 'Data stored on your device', them: 'Data stored on their servers' },
                  { us: 'You control your data', them: 'They control your data' },
                  { us: 'Zero tracking by default', them: 'Tracking for ads/analytics' },
                  { us: 'Export anytime', them: 'Vendor lock-in' },
                  { us: 'No data selling ever', them: 'May sell/share data' },
                ].map((row, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{row.us}</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">{row.them}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600 dark:bg-primary-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                Ready to Take Back Your Privacy?
              </h2>
              <p className="text-lg text-primary-100 mb-8">
                Join thousands of users who value their data privacy. Start free today.
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
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
