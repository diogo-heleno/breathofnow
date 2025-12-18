'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Wifi,
  WifiOff,
  Check,
  Circle,
  HardDrive,
  Info,
  ChevronRight,
  ArrowLeft,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
} from 'lucide-react';
import { useCacheStatus } from '@/hooks/use-cache-status';
import { CACHEABLE_PAGES } from '@/lib/pwa/cache-config';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/shell';
import { ClientOnly } from '@/components/utils/client-only';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

// Loading skeleton
function OfflineStatusLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3" />
          <div className="h-32 bg-neutral-200 rounded-xl" />
          <div className="h-48 bg-neutral-200 rounded-xl" />
          <div className="h-64 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function OfflineStatusPage({ params: { locale } }: PageProps) {
  return (
    <ClientOnly fallback={<OfflineStatusLoadingSkeleton />}>
      <OfflineStatusContent locale={locale} />
    </ClientOnly>
  );
}

function OfflineStatusContent({ locale }: { locale: Locale }) {
  const t = useTranslations('offline');
  const tPwa = useTranslations('pwa');
  const tCommon = useTranslations('common');
  const currentLocale = useLocale();
  const { status, isLoading, isOnline } = useCacheStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get battery config based on percentage
  const getBatteryConfig = (percentage: number) => {
    if (percentage <= 10) {
      return {
        icon: Battery,
        label: t('battery.empty'),
        colorClass: 'text-red-500',
        bgClass: 'bg-red-100',
      };
    }
    if (percentage <= 30) {
      return {
        icon: BatteryLow,
        label: t('battery.low'),
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-100',
      };
    }
    if (percentage <= 60) {
      return {
        icon: BatteryMedium,
        label: t('battery.medium'),
        colorClass: 'text-yellow-500',
        bgClass: 'bg-yellow-100',
      };
    }
    if (percentage <= 90) {
      return {
        icon: BatteryMedium,
        label: t('battery.high'),
        colorClass: 'text-lime-600',
        bgClass: 'bg-lime-100',
      };
    }
    return {
      icon: BatteryFull,
      label: t('battery.full'),
      colorClass: 'text-green-500',
      bgClass: 'bg-green-100',
    };
  };

  if (!mounted || isLoading || !status) {
    return (
      <AppShell locale={locale}>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded w-1/3" />
            <div className="h-32 bg-neutral-200 rounded-xl" />
            <div className="h-48 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  const percentage = status.percentage;
  const { icon: BatteryIcon, label: batteryLabel, colorClass, bgClass } = getBatteryConfig(percentage);

  return (
    <AppShell locale={locale}>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={`/${currentLocale}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {tCommon('back')}
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-display">
            {t('page.title')}
          </h1>
          <p className="text-neutral-600 mt-1">{t('page.subtitle')}</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              {/* Online/Offline Status */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isOnline
                      ? 'bg-green-100'
                      : 'bg-amber-100'
                  )}
                >
                  {isOnline ? (
                    <Wifi className="w-6 h-6 text-green-600" />
                  ) : (
                    <WifiOff className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">
                    {isOnline ? t('page.status.online') : t('page.status.offline')}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {t('indicator.online')} / {t('indicator.offline')}
                  </p>
                </div>
              </div>

              {/* Cache Percentage */}
              <div className="flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', bgClass)}>
                  <BatteryIcon className={cn('w-6 h-6', colorClass)} />
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-neutral-900">
                    {percentage}%
                  </p>
                  <p className="text-sm text-neutral-500">{batteryLabel}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                  percentage <= 30 ? 'bg-red-500' :
                  percentage <= 60 ? 'bg-yellow-500' :
                  percentage <= 90 ? 'bg-lime-500' :
                  'bg-green-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-center text-sm text-neutral-600 mt-3">
              {t('page.percentage', { percentage })}
            </p>
          </CardContent>
        </Card>

        {/* Explanation Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('page.explanation.title')}
              </h2>
            </div>

            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
              <p>{t('page.explanation.paragraph1')}</p>
              <p className="font-medium text-neutral-700">
                {t('page.explanation.paragraph2', { percentage })}
              </p>
              <p>{t('page.explanation.paragraph3')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pages List Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {t('page.pages.title')}
            </h2>

            <div className="space-y-2">
              {status.pages.map(({ page, isCached }) => (
                <div
                  key={page.path}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl transition-colors',
                    isCached
                      ? 'bg-green-50'
                      : 'bg-neutral-50 hover:bg-neutral-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isCached ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <Circle className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <div>
                      <p className={cn(
                        'font-medium',
                        isCached ? 'text-green-700' : 'text-neutral-700'
                      )}>
                        {tPwa(page.nameKey)}
                      </p>
                      <p className={cn(
                        'text-xs',
                        isCached ? 'text-green-600' : 'text-neutral-500'
                      )}>
                        {isCached ? t('page.pages.available') : t('page.pages.notVisited')}
                      </p>
                    </div>
                  </div>

                  {!isCached && (
                    <Link
                      href={`/${currentLocale}${page.path === '/' ? '' : page.path}`}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {t('page.pages.visitToCache')}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Note Card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 mb-1">
                  {t('page.dataNote.title')}
                </h3>
                <p className="text-sm text-green-700">
                  {t('page.dataNote.text')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
