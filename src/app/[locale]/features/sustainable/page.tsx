import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Leaf, Building2, TrendingDown, Heart, Clock, ArrowRight, Check, Users } from 'lucide-react';
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
  const t = await getTranslations({ locale, namespace: 'featuresPages.sustainable' });
  return {
    title: `${t('title')} - Breath of Now`,
    description: t('metaDescription'),
  };
}

export default async function SustainablePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'featuresPages.sustainable' });
  const tCommon = await getTranslations({ locale, namespace: 'featuresPages.common' });

  const principles = [
    {
      icon: Building2,
      titleKey: 'features.noVc.title',
      descriptionKey: 'features.noVc.description',
    },
    {
      icon: TrendingDown,
      titleKey: 'features.noBaitSwitch.title',
      descriptionKey: 'features.noBaitSwitch.description',
    },
    {
      icon: Heart,
      titleKey: 'features.longTermView.title',
      descriptionKey: 'features.longTermView.description',
    },
    {
      icon: Clock,
      titleKey: 'features.profitableModel.title',
      descriptionKey: 'features.profitableModel.description',
    },
    {
      icon: Users,
      titleKey: 'features.dataPortability.title',
      descriptionKey: 'features.dataPortability.description',
    },
    {
      icon: Leaf,
      titleKey: 'features.minimalDependencies.title',
      descriptionKey: 'features.minimalDependencies.description',
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-8">
                <Leaf className="w-10 h-10" />
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

        {/* Principles Section */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('approach')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t('approachSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {principles.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {t(principle.titleKey)}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {t(principle.descriptionKey)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t('whyMatters')}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { titleKey: 'whyList.reliability.title', descKey: 'whyList.reliability.desc' },
                  { titleKey: 'whyList.stability.title', descKey: 'whyList.stability.desc' },
                  { titleKey: 'whyList.trust.title', descKey: 'whyList.trust.desc' },
                  { titleKey: 'whyList.continuity.title', descKey: 'whyList.continuity.desc' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-emerald-600 dark:bg-emerald-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-emerald-100 mb-8">
                {t('cta.subtitle')}
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
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
