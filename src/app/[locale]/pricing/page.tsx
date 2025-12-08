'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore, usePricingStore } from '@/stores/app-store';
import { regionPricing, priceMultipliers } from '@/i18n';
import { formatCurrency } from '@/lib/utils';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export default function PricingPage({ params: { locale } }: PageProps) {
  const t = useTranslations();
  const { country } = useAppStore();
  const { 
    suggestedMonthly, 
    suggestedLifetime, 
    customMonthly, 
    customLifetime,
    setSuggestedPrices,
    setCustomMonthly,
    setCustomLifetime,
  } = usePricingStore();

  const BASE_MONTHLY = 5;
  const BASE_LIFETIME = 49;

  useEffect(() => {
    const region = regionPricing[country] || regionPricing.default;
    const multiplier = priceMultipliers[region.tier];
    
    setSuggestedPrices(
      Math.round(BASE_MONTHLY * multiplier * 100) / 100,
      Math.round(BASE_LIFETIME * multiplier * 100) / 100
    );
  }, [country, setSuggestedPrices]);

  const region = regionPricing[country] || regionPricing.default;
  const effectiveMonthly = customMonthly ?? suggestedMonthly;
  const effectiveLifetime = customLifetime ?? suggestedLifetime;

  const plans = [
    {
      id: 'free',
      popular: false,
      price: 0,
      period: t('pricing.free.period'),
      features: t.raw('pricing.free.features') as string[],
      cta: t('pricing.free.cta'),
      variant: 'secondary' as const,
    },
    {
      id: 'supporter',
      popular: true,
      price: effectiveMonthly,
      suggestedPrice: suggestedMonthly,
      period: t('pricing.supporter.period'),
      features: t.raw('pricing.supporter.features') as string[],
      cta: t('pricing.supporter.cta'),
      variant: 'primary' as const,
      customizable: true,
      onCustomize: setCustomMonthly,
      customValue: customMonthly,
    },
    {
      id: 'lifetime',
      popular: false,
      price: effectiveLifetime,
      suggestedPrice: suggestedLifetime,
      period: t('pricing.lifetime.period'),
      features: t.raw('pricing.lifetime.features') as string[],
      cta: t('pricing.lifetime.cta'),
      variant: 'accent' as const,
      customizable: true,
      onCustomize: setCustomLifetime,
      customValue: customLifetime,
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-app">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary-500 shadow-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-xl">
                      {t(`pricing.${plan.id}.title`)}
                    </CardTitle>
                    <CardDescription>
                      {t(`pricing.${plan.id}.description`)}
                    </CardDescription>
                  </CardHeader>

                  <div className="mb-6">
                    {plan.customizable ? (
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-neutral-500">
                            {t('pricing.suggestedPrice')}:
                          </span>
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {formatCurrency(plan.suggestedPrice!, region.currency, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-500">
                            {t('pricing.yourPrice')}:
                          </span>
                          <div className="relative flex-1 max-w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                              {region.symbol}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={plan.customValue ?? plan.suggestedPrice}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                plan.onCustomize?.(isNaN(value) ? null : value);
                              }}
                              className="pl-8 py-2 text-lg font-semibold"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">{plan.period}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(plan.price, region.currency, locale)}
                        </span>
                        <span className="text-neutral-500 ml-2">{plan.period}</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button variant={plan.variant} className="w-full">
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              Have questions?{' '}
              <a href="/faq" className="text-primary-600 dark:text-primary-400 hover:underline">
                Check our FAQ
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
