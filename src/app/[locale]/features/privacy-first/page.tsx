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
  const t = await getTranslations({ locale, namespace: 'featuresPages.privacyFirst' });
  return {
    title: `${t('title')} - Breath of Now`,
    description: t('metaDescription'),
  };
}

export default async function PrivacyFirstPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'featuresPages.privacyFirst' });
  const tCommon = await getTranslations({ locale, namespace: 'featuresPages.common' });

  const features = [
    {
      icon: Database,
      titleKey: 'features.localStorage.title',
      descriptionKey: 'features.localStorage.description',
    },
    {
      icon: Lock,
      titleKey: 'features.encryption.title',
      descriptionKey: 'features.encryption.description',
    },
    {
      icon: Eye,
      titleKey: 'features.zeroKnowledge.title',
      descriptionKey: 'features.zeroKnowledge.description',
    },
    {
      icon: Server,
      titleKey: 'features.noTracking.title',
      descriptionKey: 'features.noTracking.description',
    },
    {
      icon: Smartphone,
      titleKey: 'features.yourControl.title',
      descriptionKey: 'features.yourControl.description',
    },
    {
      icon: Shield,
      titleKey: 'features.gdpr.title',
      descriptionKey: 'features.gdpr.description',
    },
  ];

  const comparisonRows = [
    { us: t('comparison.us1'), them: t('comparison.them1') },
    { us: t('comparison.us2'), them: t('comparison.them2') },
    { us: t('comparison.us3'), them: t('comparison.them3') },
    { us: t('comparison.us4'), them: t('comparison.them4') },
    { us: t('comparison.us5'), them: t('comparison.them5') },
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
                {t('title')}
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                {t('subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/auth/signup`}>
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {tCommon('getStartedFree')}
                  </Button>
                </Link>
                <Link href="https://www.breathofnow.site/#apps">
                  <Button variant="outline" size="lg">
                    {tCommon('exploreApps')}
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
                {t('howWeProtect')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t('howWeProtectSubtitle')}
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
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {t(feature.descriptionKey)}
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
                  {t('whereDataLives')}
                </h2>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <Smartphone className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('yourDevice')}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t('yourDeviceDesc')}
                    </p>
                    <div className="mt-4 text-green-600 font-medium">{t('private100')}</div>
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
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('cloudOptional')}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t('cloudOptionalDesc')}
                    </p>
                    <div className="mt-4 text-blue-600 font-medium">{t('encrypted')}</div>
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
                  {t('weDifferent')}
                </h2>
              </div>

              <div className="space-y-4">
                {comparisonRows.map((row, index) => (
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
                {t('cta.title')}
              </h2>
              <p className="text-lg text-primary-100 mb-8">
                {t('cta.subtitle')}
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                  {tCommon('getStartedFree')}
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
