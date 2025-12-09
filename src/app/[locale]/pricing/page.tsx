'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Star, Crown, Zap, Users } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export default function PricingPage({ params: { locale } }: PageProps) {
  const t = useTranslations();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const supporterPrice = billingPeriod === 'monthly' ? '€1.99' : '€19.99';
  const supporterPeriod = billingPeriod === 'monthly'
    ? t('pricing.supporter.periodMonthly')
    : t('pricing.supporter.periodYearly');

  const plans = [
    {
      id: 'free',
      icon: Zap,
      iconColor: 'text-neutral-500',
      iconBg: 'bg-neutral-100 dark:bg-neutral-800',
      popular: false,
      price: t('pricing.freePrice'),
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
      popular: true,
      price: supporterPrice,
      period: supporterPeriod,
      description: t('pricing.supporter.description'),
      features: t.raw('pricing.supporter.features') as string[],
      cta: t('pricing.supporter.cta'),
      variant: 'primary' as const,
      showBillingToggle: true,
      savings: billingPeriod === 'yearly' ? t('pricing.supporter.savings') : null,
    },
    {
      id: 'founder',
      icon: Crown,
      iconColor: 'text-accent-500',
      iconBg: 'bg-accent-100 dark:bg-accent-900/30',
      popular: false,
      price: '€599',
      period: t('pricing.founder.period'),
      description: t('pricing.founder.description'),
      features: t.raw('pricing.founder.features') as string[],
      cta: t('pricing.founder.cta'),
      variant: 'accent' as const,
      badge: t('pricing.founder.badge'),
      limitedSpots: true,
    },
  ];

  return (
    <>
      <Header locale={locale} />

      <main className="min-h-screen pt-32 pb-20">
        <div className="container-app">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display text-display-md md:text-display-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('pricing.title')}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t('pricing.description')}
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.popular
                      ? 'border-primary-500 shadow-glow ring-1 ring-primary-500/20 scale-105'
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
                      <CardTitle className="text-lg">
                        {t(`pricing.${plan.id}.title`)}
                      </CardTitle>
                    </div>

                    <CardDescription className="mb-6">
                      {plan.description}
                    </CardDescription>

                    {/* Billing Toggle for Supporter */}
                    {plan.showBillingToggle && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <button
                          onClick={() => setBillingPeriod('monthly')}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            billingPeriod === 'monthly'
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                        >
                          {t('pricing.monthly')}
                        </button>
                        <button
                          onClick={() => setBillingPeriod('yearly')}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            billingPeriod === 'yearly'
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                        >
                          {t('pricing.yearly')}
                        </button>
                      </div>
                    )}

                    {/* Price Section */}
                    <div className="text-center py-4 mb-4">
                      <span className="text-4xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                        {plan.price}
                      </span>
                      <span className="text-neutral-500 ml-2 text-sm">{plan.period}</span>
                      {plan.savings && (
                        <p className="text-sm text-primary-600 mt-1">{plan.savings}</p>
                      )}
                    </div>

                    {/* Limited Spots Indicator */}
                    {plan.limitedSpots && (
                      <div className="flex items-center justify-center gap-2 mb-4 text-sm text-accent-600 dark:text-accent-400">
                        <Users className="w-4 h-4" />
                        <span>{t('pricing.founder.limitedSpots')}</span>
                      </div>
                    )}

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

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <p className="text-neutral-500 text-sm mb-8">
              {t('pricing.securePayment')}
            </p>
          </div>

          {/* FAQ Link */}
          <div className="mt-8 text-center">
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
