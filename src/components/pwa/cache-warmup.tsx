'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Check, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui';

interface WarmupResult {
  success: number;
  failed: number;
  skipped: number;
}

interface WarmupProgress {
  cached: number;
  total: number;
  page: string;
}

export function CacheWarmup() {
  const t = useTranslations('pwa');
  const [isWarming, setIsWarming] = useState(false);
  const [progress, setProgress] = useState<WarmupProgress>({ cached: 0, total: 0, page: '' });
  const [result, setResult] = useState<WarmupResult | null>(null);

  const startWarmup = async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!registration.active) {
        console.warn('No active service worker');
        return;
      }

      setIsWarming(true);
      setResult(null);
      setProgress({ cached: 0, total: 0, page: '' });

      // Create message channel
      const messageChannel = new MessageChannel();

      // Listen for progress updates
      messageChannel.port1.onmessage = (event) => {
        const { type, cached, total, page, success, failed, skipped } = event.data;

        if (type === 'WARMUP_PROGRESS') {
          setProgress({ cached, total, page });
        } else if (type === 'WARMUP_COMPLETE') {
          setResult({ success, failed, skipped });
          setIsWarming(false);
        }
      };

      // Send warmup request
      registration.active.postMessage(
        { type: 'WARMUP_CACHE' },
        [messageChannel.port2]
      );

    } catch (error) {
      console.error('Failed to start cache warmup:', error);
      setIsWarming(false);
    }
  };

  const progressPercentage = progress.total > 0
    ? Math.round((progress.cached / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-accent-500" />
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
          {t('warmup.title')}
        </h4>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t('warmup.description')}
      </p>

      {isWarming && (
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {t('warmup.inProgress')}
            </span>
          </div>

          <div className="text-xs text-primary-600 dark:text-primary-400 truncate font-mono">
            {progress.page || '...'}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-primary-600 dark:text-primary-400">
              <span>{progress.cached}/{progress.total}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-lg ${
          result.failed === 0
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failed === 0 ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className={`text-sm font-medium ${
              result.failed === 0
                ? 'text-green-700 dark:text-green-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}>
              {t('warmup.complete')}
            </span>
          </div>

          <div className={`text-xs ${
            result.failed === 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}>
            {t('warmup.stats', {
              success: result.success,
              failed: result.failed
            })}
          </div>
        </div>
      )}

      <Button
        variant="accent"
        onClick={startWarmup}
        disabled={isWarming}
        className="w-full"
      >
        {isWarming ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('warmup.inProgress')}
          </>
        ) : (
          <>
            <Flame className="h-4 w-4 mr-2" />
            {t('warmup.start')}
          </>
        )}
      </Button>
    </div>
  );
}
