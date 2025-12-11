import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Heart, Globe, Users, Wallet, Scale, ArrowRight, Check } from 'lucide-react';
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
  const t = await getTranslations({ locale, namespace: 'featuresPages.fairPricing' });
  return {
    title: `${t('title')} - Breath of Now`,
    description: t('metaDescription'),
  };
}

export default async function FairPricingPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'featuresPages.fairPricing' });
  const tCommon = await getTranslations({ locale, namespace: 'featuresPages.common' });

  const tiers = [
    { regionKey: 'tiers.high.title', countriesKey: 'tiers.high.countries', multiplierKey: 'tiers.high.multiplier' },
    { regionKey: 'tiers.medium.title', countriesKey: 'tiers.medium.countries', multiplierKey: 'tiers.medium.multiplier' },
    { regionKey: 'tiers.low.title', countriesKey: 'tiers.low.countries', multiplierKey: 'tiers.low.multiplier' },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-8">
                <Heart className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                {t('title')}
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                {t('subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://www.breathofnow.site/pricing">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {tCommon('viewPricing')}
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

        {/* How It Works */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('howItWorks')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t('howItWorksSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: Globe, titleKey: 'features.regionalPricing.title', descKey: 'features.regionalPricing.description' },
                { icon: Scale, titleKey: 'features.transparentTiers.title', descKey: 'features.transparentTiers.description' },
                { icon: Wallet, titleKey: 'features.freeTier.title', descKey: 'features.freeTier.description' },
                { icon: Heart, titleKey: 'features.noUpselling.title', descKey: 'features.noUpselling.description' },
                { icon: Users, titleKey: 'features.lifetimeOption.title', descKey: 'features.lifetimeOption.description' },
                { icon: Check, titleKey: 'features.cancelAnytime.title', descKey: 'features.cancelAnytime.description' },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        {t(feature.descKey)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Regional Tiers */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t('pricingTiers')}
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {tiers.map((tier, index) => (
                  <div key={index} className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 text-center">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-2">
                      {t(tier.regionKey)}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      {t(tier.countriesKey)}
                    </p>
                    <span className="inline-flex px-4 py-2 rounded-full text-lg font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                      {t(tier.multiplierKey)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-rose-600 dark:bg-rose-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-rose-100 mb-8">
                {t('cta.subtitle')}
              </p>
              <Link href="https://www.breathofnow.site/pricing">
                <Button variant="secondary" size="lg" className="bg-white text-rose-700 hover:bg-rose-50">
                  {tCommon('viewPricing')}
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
