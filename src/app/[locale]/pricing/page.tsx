'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Star, Sparkles, Crown, Zap } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceSlider } from '@/components/ui/price-slider';
import { useAppStore } from '@/stores/app-store';
import { regionPricing, priceMultipliers } from '@/i18n';
import { formatCurrency } from '@/lib/utils';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export default function PricingPage({ params: { locale } }: PageProps) {
  const t = useTranslations();
  const { country } = useAppStore();

  // Base prices (high tier)
  const BASE_SUPPORTER_PER_APP = 3;
  const BASE_FAN = 49;
  const BASE_FOUNDER = 199;

  const region = regionPricing[country] || regionPricing.default;
  const multiplier = priceMultipliers[region.tier];

  // Calculate suggested prices based on region
  const suggestedSupporterPerApp = Math.round(BASE_SUPPORTER_PER_APP * multiplier * 100) / 100;
  const suggestedFan = Math.round(BASE_FAN * multiplier);
  const suggestedFounder = Math.round(BASE_FOUNDER * multiplier);

  // State for customizable prices
  const [fanPrice, setFanPrice] = useState(suggestedFan);
  const [founderPrice, setFounderPrice] = useState(suggestedFounder);

  useEffect(() => {
    setFanPrice(suggestedFan);
    setFounderPrice(suggestedFounder);
  }, [suggestedFan, suggestedFounder]);

  const plans = [
    {
      id: 'free',
      icon: Zap,
      iconColor: 'text-neutral-500',
      iconBg: 'bg-neutral-100 dark:bg-neutral-800',
      popular: false,
      price: 0,
      period: t('pricing.free.period'),
      description: t('pricing.free.description'),
      features: t.raw('pricing.free.features') as string[],
      cta: t('pricing.free.cta'),
      variant: 'secondary' as const,
    },
    {
      id: 'supporter',
      icon: Star,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      popular: false,
      price: suggestedSupporterPerApp,
      period: t('pricing.supporter.period'),
      description: t('pricing.supporter.description'),
      features: t.raw('pricing.supporter.features') as string[],
      cta: t('pricing.supporter.cta'),
      variant: 'secondary' as const,
    },
    {
      id: 'fan',
      icon: Sparkles,
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-100 dark:bg-primary-900/30',
      popular: true,
      price: fanPrice,
      hasPriceSlider: true,
      suggestedPrice: suggestedFan,
      currentPrice: fanPrice,
      onPriceChange: setFanPrice,
      period: t('pricing.fan.period'),
      description: t('pricing.fan.description'),
      features: t.raw('pricing.fan.features') as string[],
      cta: t('pricing.fan.cta'),
      variant: 'primary' as const,
    },
    {
      id: 'founder',
      icon: Crown,
      iconColor: 'text-accent-500',
      iconBg: 'bg-accent-100 dark:bg-accent-900/30',
      popular: false,
      price: founderPrice,
      hasPriceSlider: true,
      suggestedPrice: suggestedFounder,
      currentPrice: founderPrice,
      onPriceChange: setFounderPrice,
      period: t('pricing.founder.period'),
      description: t('pricing.founder.description'),
      features: t.raw('pricing.founder.features') as string[],
      cta: t('pricing.founder.cta'),
      variant: 'accent' as const,
      badge: t('pricing.founder.badge'),
    },
  ];

  return (
    <>
      <Header locale={locale} />

      <main className="min-h-screen pt-32 pb-20">
        <div className="container-app">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">
              {t('pricing.payWhatYouWant')}
            </Badge>
            <h1 className="font-display text-display-md md:text-display-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('pricing.title')}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t('pricing.description')}
            </p>
            <p className="mt-4 text-sm text-neutral-500">
              {t('pricing.regionNote', { region: country })}
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.popular
                      ? 'border-primary-500 shadow-glow ring-1 ring-primary-500/20'
                      : plan.id === 'founder'
                        ? 'border-accent-500/50'
                        : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary">{t('pricing.mostPopular')}</Badge>
                    </div>
                  )}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="warning">{plan.badge}</Badge>
                    </div>
                  )}

                  <CardContent className="p-6 flex flex-col flex-1">
                    {/* Icon and Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl ${plan.iconBg}`}>
                        <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {t(`pricing.${plan.id}.title`)}
                        </CardTitle>
                      </div>
                    </div>

                    <CardDescription className="mb-6">
                      {plan.description}
                    </CardDescription>

                    {/* Price Section */}
                    <div className="mb-6">
                      {plan.hasPriceSlider ? (
                        <PriceSlider
                          suggestedPrice={plan.suggestedPrice!}
                          currency={region.currency}
                          currencySymbol={region.symbol}
                          locale={locale}
                          onChange={plan.onPriceChange!}
                          minLabel={t('pricing.minPrice')}
                          suggestedLabel={t('pricing.suggestedPrice')}
                          maxLabel={t('pricing.payWhatYouWantShort')}
                          customLabel={t('pricing.yourPrice')}
                        />
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-4xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                            {plan.price === 0
                              ? t('pricing.freePrice')
                              : formatCurrency(plan.price, region.currency, locale)}
                          </span>
                          <span className="text-neutral-500 ml-2 text-sm">{plan.period}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button variant={plan.variant} className="w-full">
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-8">
              <h3 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('pricing.aiCredits.title')}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t('pricing.aiCredits.description')}
              </p>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary-600" />
                  {t('pricing.aiCredits.feature1')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary-600" />
                  {t('pricing.aiCredits.feature2')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary-600" />
                  {t('pricing.aiCredits.feature3')}
                </li>
              </ul>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="mt-16 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('pricing.questions')}{' '}
              <a href="/faq" className="text-primary-600 dark:text-primary-400 hover:underline">
                {t('pricing.checkFaq')}
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
