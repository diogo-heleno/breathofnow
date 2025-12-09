'use client';

import { useTranslations } from 'next-intl';
import {
  Zap,
  Star,
  Sparkles,
  Shield,
  Crown,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppSelectorCompact } from './app-selector';
import {
  type Plan,
  type BillingPeriod,
  type AppId,
  formatPrice,
  getYearlySavingsPercent,
} from '@/types/pricing';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Star,
  Sparkles,
  Shield,
  Crown,
};

interface PricingCardProps {
  plan: Plan;
  billingPeriod: BillingPeriod;
  selectedApps?: AppId[];
  onAppToggle?: (appId: AppId) => void;
  onSelect: () => void;
  locale?: string;
  className?: string;
}

export function PricingCard({
  plan,
  billingPeriod,
  selectedApps = [],
  onAppToggle,
  onSelect,
  locale = 'en',
  className,
}: PricingCardProps) {
  const t = useTranslations('pricing');
  const Icon = ICON_MAP[plan.icon] || Zap;

  // Determine price to show
  const isLifetime = plan.lifetimePrice !== null;
  const currentPrice = isLifetime
    ? plan.lifetimePrice
    : billingPeriod === 'yearly'
      ? plan.yearlyPrice
      : plan.monthlyPrice;

  const monthlyEquivalent =
    !isLifetime && billingPeriod === 'yearly' && plan.yearlyPrice
      ? plan.yearlyPrice / 12
      : null;

  const savingsPercent = getYearlySavingsPercent(plan);

  // Show app selector for plans with selectable apps
  const showAppSelector =
    plan.features.canChooseApps &&
    typeof plan.features.appsIncluded === 'number';

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border-2 p-6 transition-all',
        plan.isPopular
          ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02] z-10'
          : 'border-neutral-200 dark:border-neutral-800',
        plan.id === 'founding' &&
          'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-300 dark:border-amber-700',
        className
      )}
    >
      {/* Popular badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-500 text-white">
            {t('badge.mostPopular')}
          </span>
        </div>
      )}

      {/* Limited spots badge */}
      {plan.isLimited && plan.limitedSpots && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white">
            {t('badge.limitedSpots', { spots: plan.limitedSpots })}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            plan.id === 'free' && 'bg-neutral-100 dark:bg-neutral-800',
            plan.id === 'starter' && 'bg-blue-100 dark:bg-blue-900/30',
            plan.id === 'plus' && 'bg-primary-100 dark:bg-primary-900/30',
            plan.id === 'pro' && 'bg-purple-100 dark:bg-purple-900/30',
            plan.id === 'founding' && 'bg-amber-100 dark:bg-amber-900/30'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              plan.id === 'free' && 'text-neutral-600 dark:text-neutral-400',
              plan.id === 'starter' && 'text-blue-600 dark:text-blue-400',
              plan.id === 'plus' && 'text-primary-600 dark:text-primary-400',
              plan.id === 'pro' && 'text-purple-600 dark:text-purple-400',
              plan.id === 'founding' && 'text-amber-600 dark:text-amber-400'
            )}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {plan.name}
          </h3>
          <p className="text-sm text-neutral-500">{plan.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            {currentPrice === 0 ? t('price.free') : formatPrice(currentPrice ?? 0, locale)}
          </span>
          {!isLifetime && currentPrice !== 0 && (
            <span className="text-neutral-500">
              /{billingPeriod === 'yearly' ? t('price.year') : t('price.month')}
            </span>
          )}
          {isLifetime && (
            <span className="text-neutral-500">{t('price.lifetime')}</span>
          )}
        </div>

        {/* Monthly equivalent for yearly billing */}
        {monthlyEquivalent !== null && (
          <p className="mt-1 text-sm text-neutral-500">
            {t('price.equivalent', {
              price: formatPrice(monthlyEquivalent, locale),
            })}
          </p>
        )}

        {/* Yearly savings */}
        {!isLifetime && billingPeriod === 'yearly' && savingsPercent > 0 && (
          <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
            {t('price.savings', { percent: savingsPercent })}
          </p>
        )}
      </div>

      {/* App Selector (for Starter/Plus) */}
      {showAppSelector && onAppToggle && (
        <div className="mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-700">
          <AppSelectorCompact
            maxApps={plan.features.appsIncluded as number}
            selectedApps={selectedApps}
            onAppToggle={onAppToggle}
          />
        </div>
      )}

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.featureList.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {feature}
            </span>
          </li>
        ))}

        {/* Show what's NOT included for Free plan */}
        {plan.id === 'free' && (
          <>
            <li className="flex items-start gap-2 opacity-50">
              <X className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-500 line-through">
                {t('features.noCloudSync')}
              </span>
            </li>
            <li className="flex items-start gap-2 opacity-50">
              <X className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-500 line-through">
                {t('features.noPrioritySupport')}
              </span>
            </li>
          </>
        )}
      </ul>

      {/* CTA Button */}
      <Button
        onClick={onSelect}
        className={cn(
          'w-full',
          plan.isPopular && 'bg-primary-600 hover:bg-primary-700',
          plan.id === 'founding' &&
            'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
        )}
        size="lg"
      >
        {plan.id === 'free'
          ? t('cta.getStarted')
          : plan.id === 'founding'
            ? t('cta.becomeFounder')
            : t('cta.subscribe')}
      </Button>
    </div>
  );
}

// Compact version for comparison table
interface PricingCardCompactProps {
  plan: Plan;
  billingPeriod: BillingPeriod;
  onSelect: () => void;
  locale?: string;
}

export function PricingCardCompact({
  plan,
  billingPeriod,
  onSelect,
  locale = 'en',
}: PricingCardCompactProps) {
  const t = useTranslations('pricing');
  const Icon = ICON_MAP[plan.icon] || Zap;

  const isLifetime = plan.lifetimePrice !== null;
  const currentPrice = isLifetime
    ? plan.lifetimePrice
    : billingPeriod === 'yearly'
      ? plan.yearlyPrice
      : plan.monthlyPrice;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border',
        plan.isPopular
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
          : 'border-neutral-200 dark:border-neutral-800'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        <div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {plan.name}
          </span>
          {plan.isPopular && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {t('badge.popular')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {currentPrice === 0
            ? t('price.free')
            : formatPrice(currentPrice ?? 0, locale)}
        </span>
        <Button size="sm" onClick={onSelect}>
          {t('cta.select')}
        </Button>
      </div>
    </div>
  );
}
