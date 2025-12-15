import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Eye, FileText, MessageSquare, Code, BookOpen, ArrowRight, Check, ExternalLink } from 'lucide-react';
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
  const t = await getTranslations({ locale, namespace: 'featuresPages.openTransparent' });
  return {
    title: `${t('title')} - Breath of Now`,
    description: t('metaDescription'),
  };
}

export default async function OpenTransparentPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'featuresPages.openTransparent' });
  const tCommon = await getTranslations({ locale, namespace: 'featuresPages.common' });

  const transparencyItems = [
    {
      icon: FileText,
      titleKey: 'features.clearPolicies.title',
      descriptionKey: 'features.clearPolicies.description',
    },
    {
      icon: Eye,
      titleKey: 'features.dataExplanation.title',
      descriptionKey: 'features.dataExplanation.description',
    },
    {
      icon: MessageSquare,
      titleKey: 'features.noHiddenFees.title',
      descriptionKey: 'features.noHiddenFees.description',
    },
    {
      icon: Code,
      titleKey: 'features.openRoadmap.title',
      descriptionKey: 'features.openRoadmap.description',
    },
    {
      icon: BookOpen,
      titleKey: 'features.honestMarketing.title',
      descriptionKey: 'features.honestMarketing.description',
    },
    {
      icon: Check,
      titleKey: 'features.responsiveFeedback.title',
      descriptionKey: 'features.responsiveFeedback.description',
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-200/30 dark:bg-cyan-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 mb-8">
                <Eye className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                {t('title')}
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                {t('subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/privacy`}>
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {tCommon('readPrivacyPolicy')}
                  </Button>
                </Link>
                <Link href="https://www.breathofnow.site/faq">
                  <Button variant="outline" size="lg">
                    {tCommon('viewFaq')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Items */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('commitment')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t('commitmentSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {transparencyItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {t(item.descriptionKey)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* What We Promise */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t('whatWePromise')}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'promises.noSelling' },
                  { key: 'promises.noTracking' },
                  { key: 'promises.noAds' },
                  { key: 'promises.noPriceHikes' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-neutral-300">{t(item.key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-cyan-600 dark:bg-cyan-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-cyan-100 mb-8">
                {t('cta.subtitle')}
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-cyan-700 hover:bg-cyan-50">
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
