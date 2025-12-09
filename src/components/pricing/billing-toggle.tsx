'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { BillingPeriod } from '@/types/pricing';

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  savingsPercent?: number;
  className?: string;
}

export function BillingToggle({
  value,
  onChange,
  savingsPercent = 17,
  className,
}: BillingToggleProps) {
  const t = useTranslations('pricing');

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
        <button
          onClick={() => onChange('monthly')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            value === 'monthly'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          )}
        >
          {t('billing.monthly')}
        </button>
        <button
          onClick={() => onChange('yearly')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            value === 'yearly'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          )}
        >
          {t('billing.yearly')}
        </button>
      </div>

      {/* Savings badge */}
      {savingsPercent > 0 && (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          {t('billing.save', { percent: savingsPercent })}
        </span>
      )}
    </div>
  );
}
