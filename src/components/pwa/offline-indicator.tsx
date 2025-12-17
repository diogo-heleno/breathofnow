'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Wifi, WifiOff, Download, Check, Cloud } from 'lucide-react';
import { useCacheStatus } from '@/hooks/use-cache-status';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showPercentage?: boolean;
  onClick?: () => void;
}

export function OfflineIndicator({
  className,
  showPercentage = true,
  onClick
}: OfflineIndicatorProps) {
  const t = useTranslations('pwa');
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
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          'bg-neutral-100 text-neutral-400 animate-pulse',
          className
        )}
      >
        <Cloud className="h-4 w-4" />
        <span className="hidden sm:inline">...</span>
      </div>
    );
  }

  const percentage = status.percentage;
  const isFullyCached = percentage === 100;

  // Determine icon and styling based on state
  const getStateConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        label: t('offlineStatus.offline')
      };
    }

    if (isFullyCached) {
      return {
        icon: Check,
        bgClass: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
        label: t('offlineStatus.ready')
      };
    }

    return {
      icon: Download,
      bgClass: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
      label: t('offlineStatus.available')
    };
  };

  const { icon: Icon, bgClass, label } = getStateConfig();

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
        'transition-all duration-200',
        bgClass,
        onClick && 'cursor-pointer',
        className
      )}
      title={t('offlineStatus.tooltip')}
      aria-label={t('offlineStatus.tooltip')}
    >
      <Icon className="h-4 w-4" />

      {showPercentage && (
        <span className="font-medium font-mono text-xs">
          {percentage}%
        </span>
      )}

      <span className="hidden sm:inline text-xs">
        {label}
      </span>
    </button>
  );
}
