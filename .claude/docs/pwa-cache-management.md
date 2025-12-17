# PWA Cache Management - Breath of Now

> Última atualização: Dezembro 2024
> Prioridade: 🔴 MÁXIMA

---

## 📋 Visão Geral

Este documento descreve a implementação do sistema de gestão de cache para a PWA do Breath of Now, permitindo aos utilizadores:

1. **Precache automático** - Cache de páginas prioritárias na instalação
2. **Verificação de cache** - Saber que páginas estão em cache
3. **Indicador de progresso** - Mostrar % de conteúdo disponível offline
4. **Download manual** - Permitir ao utilizador fazer cache de páginas específicas

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Service Worker │  │   Cache API     │                   │
│  │  (sw.js)        │  │   (CacheStorage)│                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └────────┬───────────┘                             │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Cache Manager                           ││
│  │  - Precache on install                                   ││
│  │  - Check cache status                                    ││
│  │  - Calculate offline %                                   ││
│  │  - Manual page caching                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  UI Components                           ││
│  │  - OfflineIndicator (header badge)                       ││
│  │  - CacheStatusPanel (settings/modal)                     ││
│  │  - DownloadButton (per-page)                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Ficheiros

```
src/
├── lib/
│   └── pwa/
│       ├── cache-manager.ts      # Core cache logic
│       ├── cache-config.ts       # Lista de páginas e prioridades
│       └── index.ts              # Exports
├── hooks/
│   ├── use-cache-status.ts       # Hook para estado do cache
│   └── use-service-worker.ts     # Hook existente (expandir)
├── components/
│   └── pwa/
│       ├── offline-indicator.tsx      # Badge no header
│       ├── cache-status-panel.tsx     # Painel completo
│       ├── cache-progress-bar.tsx     # Barra de progresso
│       └── page-cache-button.tsx      # Botão por página
└── workers/
    └── sw.js                     # Service Worker
```

---

## 🔧 Implementação Detalhada

### 1. Configuração de Páginas (cache-config.ts)

```typescript
// src/lib/pwa/cache-config.ts

export interface CacheablePage {
  path: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'app' | 'static' | 'feature';
  nameKey: string; // Chave i18n para o nome
  estimatedSize?: number; // KB aproximado
}

// Páginas ordenadas por prioridade de cache
export const CACHEABLE_PAGES: CacheablePage[] = [
  // CRITICAL - Cache imediato na instalação
  {
    path: '/',
    priority: 'critical',
    category: 'app',
    nameKey: 'pwa.pages.home',
    estimatedSize: 50
  },
  {
    path: '/expenses',
    priority: 'critical',
    category: 'app',
    nameKey: 'pwa.pages.expenses',
    estimatedSize: 80
  },
  {
    path: '/expenses/add',
    priority: 'critical',
    category: 'app',
    nameKey: 'pwa.pages.expensesAdd',
    estimatedSize: 60
  },
  {
    path: '/fitlog',
    priority: 'critical',
    category: 'app',
    nameKey: 'pwa.pages.fitlog',
    estimatedSize: 70
  },
  
  // HIGH - Cache logo após instalação
  {
    path: '/expenses/transactions',
    priority: 'high',
    category: 'app',
    nameKey: 'pwa.pages.transactions',
    estimatedSize: 90
  },
  {
    path: '/expenses/categories',
    priority: 'high',
    category: 'app',
    nameKey: 'pwa.pages.categories',
    estimatedSize: 50
  },
  {
    path: '/expenses/reports',
    priority: 'high',
    category: 'app',
    nameKey: 'pwa.pages.reports',
    estimatedSize: 100
  },
  {
    path: '/fitlog/history',
    priority: 'high',
    category: 'app',
    nameKey: 'pwa.pages.fitlogHistory',
    estimatedSize: 80
  },
  {
    path: '/account',
    priority: 'high',
    category: 'app',
    nameKey: 'pwa.pages.account',
    estimatedSize: 60
  },
  
  // MEDIUM - Cache quando utilizador pedir ou em background
  {
    path: '/expenses/settings',
    priority: 'medium',
    category: 'app',
    nameKey: 'pwa.pages.expensesSettings',
    estimatedSize: 40
  },
  {
    path: '/pricing',
    priority: 'medium',
    category: 'static',
    nameKey: 'pwa.pages.pricing',
    estimatedSize: 70
  },
  {
    path: '/faq',
    priority: 'medium',
    category: 'static',
    nameKey: 'pwa.pages.faq',
    estimatedSize: 50
  },
  
  // LOW - Cache apenas se utilizador pedir explicitamente
  {
    path: '/privacy',
    priority: 'low',
    category: 'static',
    nameKey: 'pwa.pages.privacy',
    estimatedSize: 30
  },
  {
    path: '/terms',
    priority: 'low',
    category: 'static',
    nameKey: 'pwa.pages.terms',
    estimatedSize: 30
  },
  {
    path: '/features/privacy-first',
    priority: 'low',
    category: 'feature',
    nameKey: 'pwa.pages.featurePrivacy',
    estimatedSize: 40
  },
  {
    path: '/features/works-offline',
    priority: 'low',
    category: 'feature',
    nameKey: 'pwa.pages.featureOffline',
    estimatedSize: 40
  }
];

// Helpers
export const getCriticalPages = () => 
  CACHEABLE_PAGES.filter(p => p.priority === 'critical');

export const getHighPriorityPages = () => 
  CACHEABLE_PAGES.filter(p => p.priority === 'critical' || p.priority === 'high');

export const getTotalEstimatedSize = () => 
  CACHEABLE_PAGES.reduce((acc, p) => acc + (p.estimatedSize || 50), 0);
```

### 2. Cache Manager (cache-manager.ts)

```typescript
// src/lib/pwa/cache-manager.ts

import { CACHEABLE_PAGES, CacheablePage } from './cache-config';

const CACHE_NAME = 'breathofnow-pages-v1';
const STATIC_CACHE_NAME = 'breathofnow-static-v1';

export interface CacheStatus {
  totalPages: number;
  cachedPages: number;
  percentage: number;
  pages: PageCacheStatus[];
  totalSizeKB: number;
  cachedSizeKB: number;
}

export interface PageCacheStatus {
  page: CacheablePage;
  isCached: boolean;
  cachedAt?: Date;
}

/**
 * Verifica se uma página específica está em cache
 */
export async function isPageCached(path: string, locale: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullPath = `/${locale}${path === '/' ? '' : path}`;
    const response = await cache.match(fullPath);
    return response !== undefined;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
}

/**
 * Obtém o status completo do cache
 */
export async function getCacheStatus(locale: string): Promise<CacheStatus> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return {
      totalPages: CACHEABLE_PAGES.length,
      cachedPages: 0,
      percentage: 0,
      pages: CACHEABLE_PAGES.map(page => ({ page, isCached: false })),
      totalSizeKB: getTotalEstimatedSize(),
      cachedSizeKB: 0
    };
  }

  const pages: PageCacheStatus[] = [];
  let cachedPages = 0;
  let cachedSizeKB = 0;

  for (const page of CACHEABLE_PAGES) {
    const isCached = await isPageCached(page.path, locale);
    pages.push({ page, isCached });
    
    if (isCached) {
      cachedPages++;
      cachedSizeKB += page.estimatedSize || 50;
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
    cachedSizeKB
  };
}

/**
 * Faz cache de uma página específica
 */
export async function cachePage(path: string, locale: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullPath = `/${locale}${path === '/' ? '' : path}`;
    
    const response = await fetch(fullPath);
    if (response.ok) {
      await cache.put(fullPath, response);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error caching page:', error);
    return false;
  }
}

/**
 * Faz cache de múltiplas páginas com callback de progresso
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
    
    // Pequeno delay para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
}

/**
 * Faz precache das páginas críticas (chamado na instalação do SW)
 */
export async function precacheCriticalPages(locale: string): Promise<void> {
  const criticalPaths = getCriticalPages().map(p => p.path);
  await cachePages(criticalPaths, locale);
}

/**
 * Faz cache de todas as páginas de alta prioridade
 */
export async function cacheHighPriorityPages(
  locale: string,
  onProgress?: (current: number, total: number, path: string) => void
): Promise<{ success: number; failed: number }> {
  const highPriorityPaths = getHighPriorityPages().map(p => p.path);
  return cachePages(highPriorityPaths, locale, onProgress);
}

/**
 * Faz cache de TODAS as páginas
 */
export async function cacheAllPages(
  locale: string,
  onProgress?: (current: number, total: number, path: string) => void
): Promise<{ success: number; failed: number }> {
  const allPaths = CACHEABLE_PAGES.map(p => p.path);
  return cachePages(allPaths, locale, onProgress);
}

/**
 * Remove uma página do cache
 */
export async function removeCachedPage(path: string, locale: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullPath = `/${locale}${path === '/' ? '' : path}`;
    return await cache.delete(fullPath);
  } catch (error) {
    console.error('Error removing cached page:', error);
    return false;
  }
}

/**
 * Limpa todo o cache de páginas
 */
export async function clearPageCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    return await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

// Helper interno
function getTotalEstimatedSize(): number {
  return CACHEABLE_PAGES.reduce((acc, p) => acc + (p.estimatedSize || 50), 0);
}

function getCriticalPages(): CacheablePage[] {
  return CACHEABLE_PAGES.filter(p => p.priority === 'critical');
}

function getHighPriorityPages(): CacheablePage[] {
  return CACHEABLE_PAGES.filter(p => p.priority === 'critical' || p.priority === 'high');
}
```

### 3. Hook de Cache Status (use-cache-status.ts)

```typescript
// src/hooks/use-cache-status.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { 
  getCacheStatus, 
  cachePage, 
  cacheAllPages,
  cacheHighPriorityPages,
  clearPageCache,
  CacheStatus 
} from '@/lib/pwa/cache-manager';

interface UseCacheStatusReturn {
  status: CacheStatus | null;
  isLoading: boolean;
  isDownloading: boolean;
  downloadProgress: { current: number; total: number; path: string } | null;
  refresh: () => Promise<void>;
  downloadPage: (path: string) => Promise<boolean>;
  downloadAll: () => Promise<void>;
  downloadHighPriority: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export function useCacheStatus(): UseCacheStatusReturn {
  const locale = useLocale();
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    path: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const newStatus = await getCacheStatus(locale);
      setStatus(newStatus);
    } catch (error) {
      console.error('Error getting cache status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  const downloadPage = useCallback(async (path: string): Promise<boolean> => {
    const result = await cachePage(path, locale);
    if (result) {
      await refresh();
    }
    return result;
  }, [locale, refresh]);

  const downloadAll = useCallback(async () => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, path: '' });
    
    try {
      await cacheAllPages(locale, (current, total, path) => {
        setDownloadProgress({ current, total, path });
      });
      await refresh();
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [locale, refresh]);

  const downloadHighPriority = useCallback(async () => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0, path: '' });
    
    try {
      await cacheHighPriorityPages(locale, (current, total, path) => {
        setDownloadProgress({ current, total, path });
      });
      await refresh();
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [locale, refresh]);

  const clearCache = useCallback(async () => {
    await clearPageCache();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    status,
    isLoading,
    isDownloading,
    downloadProgress,
    refresh,
    downloadPage,
    downloadAll,
    downloadHighPriority,
    clearCache
  };
}
```

### 4. Componente Indicador Offline (offline-indicator.tsx)

```typescript
// src/components/pwa/offline-indicator.tsx

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Wifi, WifiOff, Download, Check } from 'lucide-react';
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
  const { status, isLoading } = useCacheStatus();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading || !status) {
    return null;
  }

  const percentage = status.percentage;
  const isFullyCached = percentage === 100;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
        'transition-all duration-200',
        isOnline 
          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
          : 'bg-amber-100 text-amber-700',
        className
      )}
      title={t('offlineStatus.tooltip')}
    >
      {isOnline ? (
        isFullyCached ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      
      {showPercentage && (
        <span className="font-medium">
          {percentage}%
        </span>
      )}
      
      <span className="hidden sm:inline text-xs">
        {isOnline 
          ? isFullyCached 
            ? t('offlineStatus.ready') 
            : t('offlineStatus.available')
          : t('offlineStatus.offline')
        }
      </span>
    </button>
  );
}
```

### 5. Painel de Status do Cache (cache-status-panel.tsx)

```typescript
// src/components/pwa/cache-status-panel.tsx

'use client';

import { useTranslations } from 'next-intl';
import { 
  Download, 
  Check, 
  Circle, 
  Trash2, 
  RefreshCw,
  HardDrive,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useCacheStatus } from '@/hooks/use-cache-status';
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
    refresh,
    downloadPage,
    downloadAll,
    downloadHighPriority,
    clearCache
  } = useCacheStatus();

  if (isLoading || !status) {
    return (
      <div className={cn('p-6 animate-pulse', className)}>
        <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-neutral-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const priorityGroups = {
    critical: status.pages.filter(p => p.page.priority === 'critical'),
    high: status.pages.filter(p => p.page.priority === 'high'),
    medium: status.pages.filter(p => p.page.priority === 'medium'),
    low: status.pages.filter(p => p.page.priority === 'low')
  };

  return (
    <div className={cn('p-6', className)}>
      {/* Header com progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg font-semibold text-neutral-900">
            {t('cachePanel.title')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isDownloading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
        
        {/* Barra de progresso */}
        <div className="relative h-3 bg-neutral-200 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${status.percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2 text-sm text-neutral-600">
          <span>
            {t('cachePanel.progress', { 
              cached: status.cachedPages, 
              total: status.totalPages 
            })}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {status.cachedSizeKB} / {status.totalSizeKB} KB
          </span>
        </div>
      </div>

      {/* Download Progress (se a fazer download) */}
      {isDownloading && downloadProgress && (
        <div className="mb-6 p-4 bg-primary-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-primary-600 animate-bounce" />
            <span className="text-sm font-medium text-primary-700">
              {t('cachePanel.downloading')}
            </span>
          </div>
          <div className="text-xs text-primary-600 truncate">
            {downloadProgress.path} ({downloadProgress.current}/{downloadProgress.total})
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="primary"
          size="sm"
          onClick={downloadHighPriority}
          disabled={isDownloading}
          className="flex-1"
        >
          <Zap className="h-4 w-4 mr-1" />
          {t('cachePanel.downloadEssential')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAll}
          disabled={isDownloading}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-1" />
          {t('cachePanel.downloadAll')}
        </Button>
      </div>

      {/* Lista de páginas por prioridade */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(priorityGroups).map(([priority, pages]) => (
          pages.length > 0 && (
            <div key={priority}>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {t(`cachePanel.priority.${priority}`)}
              </h4>
              <div className="space-y-1">
                {pages.map(({ page, isCached }) => (
                  <div 
                    key={page.path}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg',
                      'transition-colors',
                      isCached ? 'bg-primary-50' : 'bg-neutral-50 hover:bg-neutral-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isCached ? (
                        <Check className="h-4 w-4 text-primary-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-neutral-400" />
                      )}
                      <span className={cn(
                        'text-sm',
                        isCached ? 'text-primary-700' : 'text-neutral-600'
                      )}>
                        {t(page.nameKey)}
                      </span>
                    </div>
                    
                    {!isCached && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadPage(page.path)}
                        disabled={isDownloading}
                        className="h-7 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Limpar cache */}
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCache}
          disabled={isDownloading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {t('cachePanel.clearCache')}
        </Button>
      </div>
    </div>
  );
}
```

### 6. Service Worker Updates (sw.js)

```javascript
// public/sw.js (ou workers/sw.js se usar next-pwa)

const CACHE_NAME = 'breathofnow-pages-v1';
const STATIC_CACHE_NAME = 'breathofnow-static-v1';

// Páginas críticas para precache
const CRITICAL_PAGES = [
  '/',
  '/en',
  '/pt',
  '/es',
  '/fr',
  '/en/expenses',
  '/pt/expenses',
  '/es/expenses',
  '/fr/expenses',
  '/en/fitlog',
  '/pt/fitlog',
  '/es/fitlog',
  '/fr/fitlog'
];

// Assets estáticos para precache
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache critical pages
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CRITICAL_PAGES);
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response for cache
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If no cache, return offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Message handler for manual cache operations
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PAGE') {
    const { url } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      fetch(url).then((response) => {
        if (response.ok) {
          cache.put(url, response);
          event.ports[0].postMessage({ success: true });
        } else {
          event.ports[0].postMessage({ success: false });
        }
      }).catch(() => {
        event.ports[0].postMessage({ success: false });
      });
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({ 
          cachedUrls: keys.map(k => k.url) 
        });
      });
    });
  }
});
```

---

## 🌍 Traduções Necessárias

Adicionar a `messages/*.json`:

```json
{
  "pwa": {
    "offlineStatus": {
      "tooltip": "Offline availability status",
      "ready": "Ready offline",
      "available": "offline",
      "offline": "Offline mode"
    },
    "cachePanel": {
      "title": "Offline Content",
      "progress": "{cached} of {total} pages saved",
      "downloading": "Downloading...",
      "downloadEssential": "Download Essential",
      "downloadAll": "Download All",
      "clearCache": "Clear offline data",
      "priority": {
        "critical": "Essential",
        "high": "Recommended",
        "medium": "Optional",
        "low": "Extra"
      }
    },
    "pages": {
      "home": "Home",
      "expenses": "ExpenseFlow",
      "expensesAdd": "Add Expense",
      "transactions": "Transactions",
      "categories": "Categories",
      "reports": "Reports",
      "expensesSettings": "Settings",
      "fitlog": "FitLog",
      "fitlogHistory": "Workout History",
      "account": "Account",
      "pricing": "Pricing",
      "faq": "FAQ",
      "privacy": "Privacy Policy",
      "terms": "Terms of Service",
      "featurePrivacy": "Privacy First",
      "featureOffline": "Works Offline"
    }
  }
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Setup Básico
- [ ] Configurar `next-pwa` em `next.config.mjs`
- [ ] Criar `cache-config.ts` com lista de páginas
- [ ] Criar `cache-manager.ts` com lógica core
- [ ] Criar `use-cache-status.ts` hook

### Fase 2: Service Worker
- [ ] Implementar precache na instalação
- [ ] Implementar estratégia Network First
- [ ] Adicionar handlers para mensagens
- [ ] Testar offline funcionamento

### Fase 3: UI Components
- [ ] Criar `OfflineIndicator` para header
- [ ] Criar `CacheStatusPanel` para settings
- [ ] Adicionar traduções (4 idiomas)
- [ ] Integrar no layout/header

### Fase 4: Testing & Polish
- [ ] Testar em modo offline (DevTools)
- [ ] Testar em dispositivo real
- [ ] Optimizar tamanhos de cache
- [ ] Verificar i18n compliance

---

## 📊 Métricas de Sucesso

- [ ] 100% das páginas críticas em cache automático
- [ ] Indicador visível e clicável no header
- [ ] Download completo < 2MB total
- [ ] Funcionalidade 100% offline para ExpenseFlow e FitLog

---

**Criado:** Dezembro 2024  
**Responsável:** Diogo (M21 Global, Lda)
