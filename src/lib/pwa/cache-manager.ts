// src/lib/pwa/cache-manager.ts
// Core cache management logic for PWA

import {
  CACHEABLE_PAGES,
  CACHE_NAME,
  type CacheablePage,
  getCriticalPages,
  getHighPriorityPages,
  getTotalEstimatedSize
} from './cache-config';

export interface CacheStatus {
  totalPages: number;
  cachedPages: number;
  percentage: number;
  pages: PageCacheStatus[];
  totalSizeKB: number;
  cachedSizeKB: number;
  lastUpdated: Date;
}

export interface PageCacheStatus {
  page: CacheablePage;
  isCached: boolean;
}

/**
 * Check if Cache API is available
 */
function isCacheAvailable(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Build the full localized path for a page
 */
function buildLocalizedPath(path: string, locale: string): string {
  if (path === '/') {
    return `/${locale}`;
  }
  return `/${locale}${path}`;
}

/**
 * Check if a specific page is cached
 */
export async function isPageCached(path: string, locale: string): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullPath = buildLocalizedPath(path, locale);

    // Try to match the exact URL
    const response = await cache.match(fullPath);
    if (response) {
      return true;
    }

    // Also check with origin (some caches store full URLs)
    const fullUrl = `${window.location.origin}${fullPath}`;
    const responseWithOrigin = await cache.match(fullUrl);
    return responseWithOrigin !== undefined;
  } catch (error) {
    console.error('[CacheManager] Error checking cache:', error);
    return false;
  }
}

/**
 * Get complete cache status
 */
export async function getCacheStatus(locale: string): Promise<CacheStatus> {
  const defaultStatus: CacheStatus = {
    totalPages: CACHEABLE_PAGES.length,
    cachedPages: 0,
    percentage: 0,
    pages: CACHEABLE_PAGES.map(page => ({ page, isCached: false })),
    totalSizeKB: getTotalEstimatedSize(),
    cachedSizeKB: 0,
    lastUpdated: new Date()
  };

  if (!isCacheAvailable()) {
    return defaultStatus;
  }

  try {
    const pages: PageCacheStatus[] = [];
    let cachedPages = 0;
    let cachedSizeKB = 0;

    // Check each page in parallel for better performance
    const cacheChecks = CACHEABLE_PAGES.map(async (page) => {
      const isCached = await isPageCached(page.path, locale);
      return { page, isCached };
    });

    const results = await Promise.all(cacheChecks);

    for (const result of results) {
      pages.push(result);
      if (result.isCached) {
        cachedPages++;
        cachedSizeKB += result.page.estimatedSize;
      }
    }

    const totalPages = CACHEABLE_PAGES.length;
    const percentage = Math.round((cachedPages / totalPages) * 100);

    return {
      totalPages,
      cachedPages,
      percentage,
      pages,
      totalSizeKB: getTotalEstimatedSize(),
      cachedSizeKB,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('[CacheManager] Error getting cache status:', error);
    return defaultStatus;
  }
}

/**
 * Cache a specific page
 */
export async function cachePage(path: string, locale: string): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullPath = buildLocalizedPath(path, locale);

    // Fetch the page
    const response = await fetch(fullPath, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'text/html'
      }
    });

    if (response.ok) {
      await cache.put(fullPath, response);
      return true;
    }

    console.warn(`[CacheManager] Failed to cache ${fullPath}: ${response.status}`);
    return false;
  } catch (error) {
    console.error(`[CacheManager] Error caching page ${path}:`, error);
    return false;
  }
}

/**
 * Cache multiple pages with progress callback
 */
export async function cachePages(
  paths: string[],
  locale: string,
  onProgress?: (current: number, total: number, path: string) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    onProgress?.(i + 1, paths.length, path);

    const result = await cachePage(path, locale);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Small delay to avoid overwhelming the network
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
}

/**
 * Precache critical pages (called on SW install)
 */
export async function precacheCriticalPages(locale: string): Promise<{ success: number; failed: number }> {
  const criticalPaths = getCriticalPages().map(p => p.path);
  return cachePages(criticalPaths, locale);
}

/**
 * Cache all high priority pages (critical + high)
 */
export async function cacheHighPriorityPages(
  locale: string,
  onProgress?: (current: number, total: number, path: string) => void
): Promise<{ success: number; failed: number }> {
  const highPriorityPaths = getHighPriorityPages().map(p => p.path);
  return cachePages(highPriorityPaths, locale, onProgress);
}

/**
 * Cache ALL pages
 */
export async function cacheAllPages(
  locale: string,
  onProgress?: (current: number, total: number, path: string) => void
): Promise<{ success: number; failed: number }> {
  const allPaths = CACHEABLE_PAGES.map(p => p.path);
  return cachePages(allPaths, locale, onProgress);
}

/**
 * Remove a page from cache
 */
export async function removeCachedPage(path: string, locale: string): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullPath = buildLocalizedPath(path, locale);

    // Try to delete both path formats
    const deleted1 = await cache.delete(fullPath);
    const fullUrl = `${window.location.origin}${fullPath}`;
    const deleted2 = await cache.delete(fullUrl);

    return deleted1 || deleted2;
  } catch (error) {
    console.error('[CacheManager] Error removing cached page:', error);
    return false;
  }
}

/**
 * Clear all page cache
 */
export async function clearPageCache(): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    return await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error('[CacheManager] Error clearing cache:', error);
    return false;
  }
}

/**
 * Get cached URLs from the service worker
 */
export async function getCachedUrls(): Promise<string[]> {
  if (!isCacheAvailable()) {
    return [];
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.map(request => request.url);
  } catch (error) {
    console.error('[CacheManager] Error getting cached URLs:', error);
    return [];
  }
}

/**
 * Calculate storage usage estimate
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  } catch (error) {
    console.error('[CacheManager] Error getting storage estimate:', error);
    return null;
  }
}
