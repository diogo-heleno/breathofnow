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
  const t = await getTranslations({ locale, namespace: 'featuresPages.worksOffline' });
  return {
    title: `${t('title')} - Breath of Now`,
    description: t('metaDescription'),
  };
}

export default async function WorksOfflinePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'featuresPages.worksOffline' });
  const tCommon = await getTranslations({ locale, namespace: 'featuresPages.common' });

  const features = [
    {
      icon: WifiOff,
      titleKey: 'features.trueOffline.title',
      descriptionKey: 'features.trueOffline.description',
    },
    {
      icon: Zap,
      titleKey: 'features.instantResponse.title',
      descriptionKey: 'features.instantResponse.description',
    },
    {
      icon: Download,
      titleKey: 'features.pwa.title',
      descriptionKey: 'features.pwa.description',
    },
    {
      icon: RefreshCw,
      titleKey: 'features.smartSync.title',
      descriptionKey: 'features.smartSync.description',
    },
    {
      icon: Cloud,
      titleKey: 'features.cloudBackup.title',
      descriptionKey: 'features.cloudBackup.description',
    },
    {
      icon: Smartphone,
      titleKey: 'features.everywhere.title',
      descriptionKey: 'features.everywhere.description',
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
                {t('title')}
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                {t('description')}
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

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('alwaysAvailable.title')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t('alwaysAvailable.subtitle')}
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

        {/* How It Works */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t('howItWorks.title')}
                </h2>
              </div>

              <div className="space-y-8">
                {[
                  {
                    step: '1',
                    titleKey: 'howItWorks.steps.localStorage.title',
                    descriptionKey: 'howItWorks.steps.localStorage.description',
                    icon: Download,
                  },
                  {
                    step: '2',
                    titleKey: 'howItWorks.steps.serviceWorker.title',
                    descriptionKey: 'howItWorks.steps.serviceWorker.description',
                    icon: Zap,
                  },
                  {
                    step: '3',
                    titleKey: 'howItWorks.steps.queueChanges.title',
                    descriptionKey: 'howItWorks.steps.queueChanges.description',
                    icon: RefreshCw,
                  },
                  {
                    step: '4',
                    titleKey: 'howItWorks.steps.autoSync.title',
                    descriptionKey: 'howItWorks.steps.autoSync.description',
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
                          {t(item.titleKey)}
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {t(item.descriptionKey)}
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
                  {t('perfectFor.title')}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { emoji: '✈️', titleKey: 'perfectFor.useCases.traveling.title', descKey: 'perfectFor.useCases.traveling.description' },
                  { emoji: '🏔️', titleKey: 'perfectFor.useCases.outdoor.title', descKey: 'perfectFor.useCases.outdoor.description' },
                  { emoji: '🚇', titleKey: 'perfectFor.useCases.commuting.title', descKey: 'perfectFor.useCases.commuting.description' },
                  { emoji: '💼', titleKey: 'perfectFor.useCases.international.title', descKey: 'perfectFor.useCases.international.description' },
                  { emoji: '🏠', titleKey: 'perfectFor.useCases.poorConnectivity.title', descKey: 'perfectFor.useCases.poorConnectivity.description' },
                  { emoji: '⚡', titleKey: 'perfectFor.useCases.speed.title', descKey: 'perfectFor.useCases.speed.description' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t(item.titleKey)}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t(item.descKey)}</p>
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
                {t('cta.title')}
              </h2>
              <p className="text-lg text-blue-100 mb-8">
                {t('cta.description')}
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  {tCommon('getStartedFree')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </>
  );
}
