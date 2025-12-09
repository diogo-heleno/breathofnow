'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Sparkles,
  Lock,
  CreditCard,
  HelpCircle,
  Shield,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PricingCard, BillingToggle } from '@/components/pricing';
import { useSubscriptionStore } from '@/stores/pricing-store';
import {
  PLANS,
  type BillingPeriod,
  type AppId,
  formatPrice,
} from '@/types/pricing';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export default function PricingPage({ params: { locale } }: PageProps) {
  const t = useTranslations('pricing');
  const router = useRouter();

  // Local UI state for pricing page
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [selectedApps, setSelectedApps] = useState<AppId[]>([]);

  // Subscription store for actual tier management
  const { setTier } = useSubscriptionStore();

  const toggleApp = (appId: AppId) => {
    setSelectedApps((prev) =>
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId]
    );
  };

  // Filter plans for main grid (excluding founding)
  const mainPlans = PLANS.filter((p) => p.id !== 'founding');
  const foundingPlan = PLANS.find((p) => p.id === 'founding');

  const handleSelectPlan = (planId: string) => {
    setTier(planId as 'free' | 'starter' | 'plus' | 'pro' | 'founding');
    // TODO: Navigate to checkout or handle subscription
    if (planId === 'free') {
      router.push(`/${locale}/expenses`);
    }
  };

  return (
    <>
      <Header locale={locale} />

      <main className="min-h-screen pt-24 pb-20">
        <div className="container-app">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">
              {t('hero.badge')}
            </Badge>
            <h1 className="font-display text-display-md md:text-display-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
              {t('hero.subtitle')}
            </p>

            {/* Billing Toggle */}
            <BillingToggle
              value={billingPeriod}
              onChange={setBillingPeriod}
              savingsPercent={17}
            />
          </div>

          {/* Main Pricing Grid - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
            {mainPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingPeriod={billingPeriod}
                selectedApps={selectedApps}
                onAppToggle={(appId: AppId) => {
                  toggleApp(appId);
                }}
                onSelect={() => handleSelectPlan(plan.id)}
                locale={locale}
              />
            ))}
          </div>

          {/* Founding Member Section */}
          {foundingPlan && (
            <div className="max-w-3xl mx-auto mb-16">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {t('founding.title')}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {t('founding.subtitle')}
                </p>
              </div>

              <div className="relative rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-8">
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                    {t('badge.limitedSpots', { spots: foundingPlan.limitedSpots })}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                          {foundingPlan.name}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {foundingPlan.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="text-5xl font-bold text-neutral-900 dark:text-neutral-100">
                        {formatPrice(foundingPlan.lifetimePrice ?? 0, locale)}
                      </span>
                      <span className="text-neutral-500 ml-2">
                        {t('price.oneTime')}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleSelectPlan('founding')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      size="lg"
                    >
                      {t('cta.becomeFounder')}
                    </Button>
                  </div>

                  {/* Right: Features */}
                  <div>
                    <ul className="space-y-3">
                      {foundingPlan.featureList.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100 text-center mb-8">
              {t('comparison.title')}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-4 px-4 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('comparison.feature')}
                    </th>
                    {PLANS.filter((p) => p.id !== 'founding').map((plan) => (
                      <th
                        key={plan.id}
                        className={cn(
                          'text-center py-4 px-4 font-medium',
                          plan.isPopular
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {/* Apps Included */}
                  <ComparisonRow
                    feature={t('comparison.appsIncluded')}
                    values={['all', '1', '3', 'all']}
                    icons={[true, true, true, true]}
                  />
                  {/* Local Storage */}
                  <ComparisonRow
                    feature={t('comparison.localStorage')}
                    values={[true, true, true, true]}
                  />
                  {/* Google Drive */}
                  <ComparisonRow
                    feature={t('comparison.googleDrive')}
                    values={[false, true, true, true]}
                  />
                  {/* Cloud Sync */}
                  <ComparisonRow
                    feature={t('comparison.cloudSync')}
                    values={[false, false, true, true]}
                  />
                  {/* Ads */}
                  <ComparisonRow
                    feature={t('comparison.noAds')}
                    values={[false, true, true, true]}
                  />
                  {/* Priority Support */}
                  <ComparisonRow
                    feature={t('comparison.prioritySupport')}
                    values={[false, false, false, true]}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Section */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TrustCard
                icon={Lock}
                title={t('trust.privacy.title')}
                description={t('trust.privacy.description')}
              />
              <TrustCard
                icon={CreditCard}
                title={t('trust.payment.title')}
                description={t('trust.payment.description')}
              />
              <TrustCard
                icon={Shield}
                title={t('trust.cancel.title')}
                description={t('trust.cancel.description')}
              />
            </div>
          </div>

          {/* FAQ Link */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <HelpCircle className="w-5 h-5" />
              <span>{t('faq.question')}</span>
              <a
                href={`/${locale}/faq`}
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                {t('faq.link')}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// Comparison row component
interface ComparisonRowProps {
  feature: string;
  values: (boolean | string)[];
  icons?: boolean[];
}

function ComparisonRow({ feature, values, icons }: ComparisonRowProps) {
  return (
    <tr>
      <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
        {feature}
      </td>
      {values.map((value, index) => (
        <td key={index} className="py-3 px-4 text-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="w-5 h-5 text-green-500 mx-auto" />
            ) : (
              <X className="w-5 h-5 text-neutral-300 dark:text-neutral-600 mx-auto" />
            )
          ) : (
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {value === 'all' ? 'All' : value}
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

// Trust card component
interface TrustCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function TrustCard({ icon: Icon, title, description }: TrustCardProps) {
  return (
    <div className="text-center p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
}
