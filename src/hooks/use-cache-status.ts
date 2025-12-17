'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  getCacheStatus,
  cachePage,
  cacheAllPages,
  cacheHighPriorityPages,
  clearPageCache,
  type CacheStatus
} from '@/lib/pwa/cache-manager';

interface DownloadProgress {
  current: number;
  total: number;
  path: string;
}

interface UseCacheStatusReturn {
  status: CacheStatus | null;
  isLoading: boolean;
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  isOnline: boolean;
  refresh: () => Promise<void>;
  downloadPage: (path: string) => Promise<boolean>;
  downloadAll: () => Promise<{ success: number; failed: number }>;
  downloadHighPriority: () => Promise<{ success: number; failed: number }>;
  clearCache: () => Promise<void>;
}

export function useCacheStatus(): UseCacheStatusReturn {
  const locale = useLocale();
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Refresh cache status
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const newStatus = await getCacheStatus(locale);
      setStatus(newStatus);
    } catch (error) {
      console.error('[useCacheStatus] Error getting cache status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  // Download a single page
  const downloadPage = useCallback(async (path: string): Promise<boolean> => {
    if (!isOnline) {
      return false;
    }

    const result = await cachePage(path, locale);
    if (result) {
      await refresh();
    }
    return result;
  }, [locale, refresh, isOnline]);

  // Download all pages
  const downloadAll = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, path: '' });

    try {
      const result = await cacheAllPages(locale, (current, total, path) => {
        setDownloadProgress({ current, total, path });
      });
      await refresh();
      return result;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [locale, refresh, isOnline]);

  // Download high priority pages
  const downloadHighPriority = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, path: '' });

    try {
      const result = await cacheHighPriorityPages(locale, (current, total, path) => {
        setDownloadProgress({ current, total, path });
      });
      await refresh();
      return result;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [locale, refresh, isOnline]);

  // Clear all cache
  const clearCache = useCallback(async () => {
    await clearPageCache();
    await refresh();
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
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
  };
}
