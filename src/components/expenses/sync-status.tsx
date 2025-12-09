/**
 * Sync Status Component
 * 
 * Mostra o estado de sincronização e permite ações manuais
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Check,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSync } from '@/hooks/use-sync';

interface SyncStatusProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function SyncStatus({
  compact = false,
  showDetails = false,
  className,
}: SyncStatusProps) {
  const t = useTranslations('expenseFlow.sync');
  const {
    status,
    lastSyncAt,
    isOnline,
    isAuthenticated,
    conflictCount,
    sync,
    error,
  } = useSync();
  
  const [showError, setShowError] = useState(false);
  
  const formatLastSync = (date: Date | null): string => {
    if (!date) return t('never');
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return t('justNow');
    if (minutes < 60) return t('minutesAgo', { minutes });
    if (hours < 24) return t('hoursAgo', { hours });
    return date.toLocaleDateString();
  };
  
  const handleSync = async () => {
    try {
      await sync();
      setShowError(false);
    } catch {
      setShowError(true);
    }
  };
  
  // Versão compacta (para header)
  if (compact) {
    return (
      <button
        onClick={handleSync}
        disabled={status === 'syncing' || !isOnline || !isAuthenticated}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
          'text-sm text-neutral-600 dark:text-neutral-400',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        title={isOnline ? (isAuthenticated ? t('clickToSync') : t('signInToSync')) : t('offline')}
      >
        {status === 'syncing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : !isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-500" />
        ) : status === 'error' ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : conflictCount > 0 ? (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        ) : (
          <Cloud className="w-4 h-4 text-green-500" />
        )}
        
        {!compact && (
          <span>
            {status === 'syncing'
              ? t('syncing')
              : !isOnline
                ? t('offline')
                : formatLastSync(lastSyncAt)}
          </span>
        )}
      </button>
    );
  }
  
  // Versão completa
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                status === 'syncing' && 'bg-blue-100 dark:bg-blue-900/30',
                status === 'idle' && isOnline && 'bg-green-100 dark:bg-green-900/30',
                status === 'error' && 'bg-red-100 dark:bg-red-900/30',
                !isOnline && 'bg-amber-100 dark:bg-amber-900/30'
              )}
            >
              {status === 'syncing' ? (
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : status === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : conflictCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            
            {/* Status Text */}
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {status === 'syncing'
                  ? t('syncing')
                  : !isOnline
                    ? t('offline')
                    : status === 'error'
                      ? t('syncError')
                      : conflictCount > 0
                        ? t('hasConflicts', { count: conflictCount })
                        : t('synced')}
              </p>
              <p className="text-sm text-neutral-500">
                {t('lastSync')}: {formatLastSync(lastSyncAt)}
              </p>
            </div>
          </div>
          
          {/* Sync Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={status === 'syncing' || !isOnline || !isAuthenticated}
            className="shrink-0"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4 mr-2',
                status === 'syncing' && 'animate-spin'
              )}
            />
            {t('syncNow')}
          </Button>
        </div>
        
        {/* Error Message */}
        {error && showError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {/* Not Authenticated Warning */}
        {!isAuthenticated && isOnline && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm">
            {t('signInToSync')}
          </div>
        )}
        
        {/* Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">{t('connection')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {isOnline ? t('online') : t('offline')}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">{t('authentication')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {isAuthenticated ? t('authenticated') : t('notAuthenticated')}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">{t('conflicts')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {conflictCount}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">{t('status')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {status}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact sync indicator for headers
 */
export function SyncIndicator({ className }: { className?: string }) {
  return <SyncStatus compact className={className} />;
}
