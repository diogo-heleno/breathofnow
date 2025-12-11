'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ConnectionIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

export function ConnectionIndicator({ showLabel = false, className }: ConnectionIndicatorProps) {
  const { isOnline } = useServiceWorker();
  const t = useTranslations('pwa.status');

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 transition-colors',
        className
      )}
      title={isOnline ? t('online') : t('offline')}
    >
      <div
        className={cn(
          'relative flex items-center justify-center w-6 h-6 rounded-full transition-all',
          isOnline
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
        )}
      >
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        )}
        {/* Pulsing dot */}
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full',
            isOnline
              ? 'bg-green-500'
              : 'bg-amber-500 animate-pulse'
          )}
        />
      </div>
      
      {showLabel && (
        <span
          className={cn(
            'text-xs font-medium',
            isOnline
              ? 'text-green-700 dark:text-green-400'
              : 'text-amber-700 dark:text-amber-400'
          )}
        >
          {isOnline ? t('online') : t('offline')}
        </span>
      )}
    </div>
  );
}

// Versão compacta para mobile
export function ConnectionIndicatorCompact() {
  const { isOnline } = useServiceWorker();
  const t = useTranslations('pwa.status');

  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
      )}
      title={isOnline ? t('online') : t('offline')}
    />
  );
}

// Badge de sync status
interface SyncStatusBadgeProps {
  isSyncing?: boolean;
  lastSyncedAt?: Date | null;
  className?: string;
}

export function SyncStatusBadge({ isSyncing, lastSyncedAt, className }: SyncStatusBadgeProps) {
  const { isOnline } = useServiceWorker();
  const t = useTranslations('pwa.status');
  const tSync = useTranslations('expenseFlow.sync');

  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400', className)}>
        <CloudOff className="w-3.5 h-3.5" />
        <span>{t('offline')}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400', className)}>
        <Cloud className="w-3.5 h-3.5 animate-pulse" />
        <span>{tSync('syncing')}</span>
      </div>
    );
  }

  if (lastSyncedAt) {
    const timeAgo = getTimeAgo(lastSyncedAt);
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-neutral-500', className)}>
        <Cloud className="w-3.5 h-3.5" />
        <span>{tSync('synced')} {timeAgo}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400', className)}>
      <Cloud className="w-3.5 h-3.5" />
      <span>{t('online')}</span>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
