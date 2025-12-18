'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Wifi, WifiOff, Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import { useCacheStatus } from '@/hooks/use-cache-status';
import { cn } from '@/lib/utils';

interface OfflineHeaderIndicatorProps {
  className?: string;
}

/**
 * Simplified offline status indicator for the header.
 * Shows online/offline status and cache percentage.
 * Links to /[locale]/offline-status page.
 */
export function OfflineHeaderIndicator({ className }: OfflineHeaderIndicatorProps) {
  const t = useTranslations('offline');
  const locale = useLocale();
  const { status, isLoading, isOnline } = useCacheStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  if (isLoading || !status) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-full text-sm',
          'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 animate-pulse',
          className
        )}
      >
        <div className="h-4 w-4 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <div className="h-3 w-8 rounded bg-neutral-300 dark:bg-neutral-600" />
      </div>
    );
  }

  const percentage = status.percentage;

  // Get battery level and icon based on percentage
  const getBatteryConfig = () => {
    if (percentage <= 10) {
      return {
        icon: Battery,
        label: t('battery.empty'),
        colorClass: 'text-red-500 dark:text-red-400'
      };
    }
    if (percentage <= 30) {
      return {
        icon: BatteryLow,
        label: t('battery.low'),
        colorClass: 'text-orange-500 dark:text-orange-400'
      };
    }
    if (percentage <= 60) {
      return {
        icon: BatteryMedium,
        label: t('battery.medium'),
        colorClass: 'text-yellow-500 dark:text-yellow-400'
      };
    }
    if (percentage <= 90) {
      return {
        icon: BatteryMedium,
        label: t('battery.high'),
        colorClass: 'text-lime-500 dark:text-lime-400'
      };
    }
    return {
      icon: BatteryFull,
      label: t('battery.full'),
      colorClass: 'text-green-500 dark:text-green-400'
    };
  };

  const { icon: BatteryIcon, colorClass: batteryColorClass } = getBatteryConfig();

  return (
    <Link
      href={`/${locale}/offline-status`}
      className={cn(
        'flex items-center gap-2 px-2.5 py-1.5 rounded-full text-sm',
        'transition-all duration-200',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        isOnline
          ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
        className
      )}
      title={t('indicator.viewStatus')}
      aria-label={t('indicator.viewStatus')}
    >
      {/* Online/Offline Status */}
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}

      {/* Separator */}
      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />

      {/* Battery/Cache Indicator */}
      <div className="flex items-center gap-1">
        <BatteryIcon className={cn('h-4 w-4', batteryColorClass)} />
        <span className="font-mono text-xs font-medium">
          {percentage}%
        </span>
      </div>
    </Link>
  );
}
