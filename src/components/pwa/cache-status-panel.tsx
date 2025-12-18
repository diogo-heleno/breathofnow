'use client';

import { useTranslations } from 'next-intl';
import {
  Download,
  Check,
  Circle,
  Trash2,
  RefreshCw,
  HardDrive,
  Zap,
  WifiOff,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useCacheStatus } from '@/hooks/use-cache-status';
import { CacheWarmup } from './cache-warmup';
import { cn } from '@/lib/utils';

interface CacheStatusPanelProps {
  className?: string;
  onClose?: () => void;
}

export function CacheStatusPanel({ className, onClose }: CacheStatusPanelProps) {
  const t = useTranslations('pwa');
  const {
    status,
    isLoading,
    isDownloading,
    downloadProgress,
    isOnline,
    refresh,
    downloadPage,
    downloadAll,
    downloadHighPriority,
    clearCache
  } = useCacheStatus();

  // Loading skeleton
  if (isLoading || !status) {
    return (
      <div className={cn('p-6 animate-pulse', className)}>
        <div className="h-5 bg-neutral-200 rounded w-1/2 mb-4" />
        <div className="h-3 bg-neutral-200 rounded-full w-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-neutral-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Group pages by priority
  const priorityGroups = {
    critical: status.pages.filter(p => p.page.priority === 'critical'),
    high: status.pages.filter(p => p.page.priority === 'high'),
    medium: status.pages.filter(p => p.page.priority === 'medium'),
    low: status.pages.filter(p => p.page.priority === 'low')
  };

  const handleDownloadPage = async (path: string) => {
    await downloadPage(path);
  };

  const handleDownloadHighPriority = async () => {
    await downloadHighPriority();
  };

  const handleDownloadAll = async () => {
    await downloadAll();
  };

  const handleClearCache = async () => {
    await clearCache();
  };

  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-2xl shadow-soft-lg', className)}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('cachePanel.title')}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isDownloading}
              aria-label={t('cachePanel.refresh')}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${status.percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          <span>
            {t('cachePanel.progress', {
              cached: status.cachedPages,
              total: status.totalPages
            })}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">
              {status.cachedSizeKB} / {status.totalSizeKB} KB
            </span>
          </span>
        </div>
      </div>

      {/* Offline warning */}
      {!isOnline && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {t('cachePanel.offlineWarning')}
          </span>
        </div>
      )}

      {/* Low cache coverage warning */}
      {isOnline && status.percentage < 30 && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">
            <p className="font-medium mb-1">{t('cachePanel.lowCoverage')}</p>
            <p className="text-xs opacity-90">
              {t('cachePanel.lowCoverageHelp')}
            </p>
          </div>
        </div>
      )}

      {/* Cache Warmup Section */}
      {isOnline && status.percentage < 80 && (
        <div className="mx-6 mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <CacheWarmup />
        </div>
      )}

      {/* Download Progress */}
      {isDownloading && downloadProgress && (
        <div className="mx-6 mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-primary-600 dark:text-primary-400 animate-bounce" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {t('cachePanel.downloading')}
            </span>
          </div>
          <div className="text-xs text-primary-600 dark:text-primary-400 truncate font-mono">
            {downloadProgress.path} ({downloadProgress.current}/{downloadProgress.total})
          </div>
          <div className="mt-2 h-1.5 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 p-6 border-b border-neutral-200 dark:border-neutral-800">
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownloadHighPriority}
          disabled={isDownloading || !isOnline}
          className="flex-1"
          leftIcon={<Zap className="h-4 w-4" />}
        >
          {t('cachePanel.downloadEssential')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAll}
          disabled={isDownloading || !isOnline}
          className="flex-1"
          leftIcon={<Download className="h-4 w-4" />}
        >
          {t('cachePanel.downloadAll')}
        </Button>
      </div>

      {/* Pages list by priority */}
      <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
        {Object.entries(priorityGroups).map(([priority, pages]) => (
          pages.length > 0 && (
            <div key={priority}>
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                {t(`cachePanel.priority.${priority}`)}
              </h4>
              <div className="space-y-2">
                {pages.map(({ page, isCached }) => (
                  <div
                    key={page.path}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl',
                      'transition-colors duration-200',
                      isCached
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isCached ? (
                        <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      )}
                      <div>
                        <span className={cn(
                          'text-sm font-medium',
                          isCached
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-neutral-700 dark:text-neutral-300'
                        )}>
                          {t(page.nameKey)}
                        </span>
                        <span className="ml-2 text-xs text-neutral-400 font-mono">
                          ~{page.estimatedSize}KB
                        </span>
                      </div>
                    </div>

                    {!isCached && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadPage(page.path)}
                        disabled={isDownloading || !isOnline}
                        className="h-8 w-8"
                        aria-label={t('cachePanel.downloadPage', { page: t(page.nameKey) })}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Clear cache footer */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearCache}
          disabled={isDownloading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          {t('cachePanel.clearCache')}
        </Button>
      </div>
    </div>
  );
}
