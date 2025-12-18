// src/lib/pwa/cache-config.ts
// Configuration for PWA cache management

export interface CacheablePage {
  path: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'app' | 'static' | 'feature';
  nameKey: string; // i18n key for the page name
  estimatedSize: number; // KB approximate
}

// Pages ordered by cache priority
export const CACHEABLE_PAGES: CacheablePage[] = [
  // CRITICAL - Cache immediately on install
  {
    path: '/',
    priority: 'critical',
    category: 'app',
    nameKey: 'pages.home',
    estimatedSize: 50
  },
  {
    path: '/expenses',
    priority: 'critical',
    category: 'app',
    nameKey: 'pages.expenses',
    estimatedSize: 80
  },
  {
    path: '/expenses/add',
    priority: 'critical',
    category: 'app',
    nameKey: 'pages.expensesAdd',
    estimatedSize: 60
  },
  {
    path: '/fitlog',
    priority: 'critical',
    category: 'app',
    nameKey: 'pages.fitlog',
    estimatedSize: 70
  },

  // HIGH - Cache soon after install
  {
    path: '/expenses/transactions',
    priority: 'high',
    category: 'app',
    nameKey: 'pages.transactions',
    estimatedSize: 90
  },
  {
    path: '/expenses/categories',
    priority: 'high',
    category: 'app',
    nameKey: 'pages.categories',
    estimatedSize: 50
  },
  {
    path: '/expenses/reports',
    priority: 'high',
    category: 'app',
    nameKey: 'pages.reports',
    estimatedSize: 100
  },
  {
    path: '/fitlog/history',
    priority: 'high',
    category: 'app',
    nameKey: 'pages.fitlogHistory',
    estimatedSize: 80
  },
  {
    path: '/account',
    priority: 'high',
    category: 'app',
    nameKey: 'pages.account',
    estimatedSize: 60
  },

  // MEDIUM - Cache on user request or in background
  {
    path: '/expenses/settings',
    priority: 'medium',
    category: 'app',
    nameKey: 'pages.expensesSettings',
    estimatedSize: 40
  },
  {
    path: '/expenses/import',
    priority: 'medium',
    category: 'app',
    nameKey: 'pages.expensesImport',
    estimatedSize: 70
  },
  {
    path: '/pricing',
    priority: 'medium',
    category: 'static',
    nameKey: 'pages.pricing',
    estimatedSize: 70
  },
  {
    path: '/faq',
    priority: 'medium',
    category: 'static',
    nameKey: 'pages.faq',
    estimatedSize: 50
  },

  // LOW - Cache only if user explicitly requests
  {
    path: '/privacy',
    priority: 'low',
    category: 'static',
    nameKey: 'pages.privacy',
    estimatedSize: 30
  },
  {
    path: '/terms',
    priority: 'low',
    category: 'static',
    nameKey: 'pages.terms',
    estimatedSize: 30
  },
  {
    path: '/features/privacy-first',
    priority: 'low',
    category: 'feature',
    nameKey: 'pages.featurePrivacy',
    estimatedSize: 40
  },
  {
    path: '/features/works-offline',
    priority: 'low',
    category: 'feature',
    nameKey: 'pages.featureOffline',
    estimatedSize: 40
  },
  {
    path: '/features/beautifully-simple',
    priority: 'low',
    category: 'feature',
    nameKey: 'pages.featureSimple',
    estimatedSize: 40
  },
  {
    path: '/features/fair-pricing',
    priority: 'low',
    category: 'feature',
    nameKey: 'pages.featurePricing',
    estimatedSize: 40
  }
];

// Cache names
export const CACHE_NAME = 'breathofnow-pages-v1';
export const STATIC_CACHE_NAME = 'breathofnow-static-v1';
export const RUNTIME_CACHE_NAME = 'breathofnow-runtime-v1';

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'fr'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Helper functions
export function getCriticalPages(): CacheablePage[] {
  return CACHEABLE_PAGES.filter(p => p.priority === 'critical');
}

export function getHighPriorityPages(): CacheablePage[] {
  return CACHEABLE_PAGES.filter(p => p.priority === 'critical' || p.priority === 'high');
}

export function getMediumPriorityPages(): CacheablePage[] {
  return CACHEABLE_PAGES.filter(p =>
    p.priority === 'critical' || p.priority === 'high' || p.priority === 'medium'
  );
}

export function getPagesByCategory(category: CacheablePage['category']): CacheablePage[] {
  return CACHEABLE_PAGES.filter(p => p.category === category);
}

export function getTotalEstimatedSize(): number {
  return CACHEABLE_PAGES.reduce((acc, p) => acc + p.estimatedSize, 0);
}

export function getEstimatedSizeByPriority(priority: CacheablePage['priority']): number {
  return CACHEABLE_PAGES
    .filter(p => p.priority === priority)
    .reduce((acc, p) => acc + p.estimatedSize, 0);
}

// Generate full paths with locale
export function getLocalizedPaths(paths: string[], locale: string): string[] {
  return paths.map(path => {
    if (path === '/') {
      return `/${locale}`;
    }
    return `/${locale}${path}`;
  });
}

// Get all critical paths for all locales (for SW precache)
export function getAllCriticalPaths(): string[] {
  const criticalPaths = getCriticalPages().map(p => p.path);
  const allPaths: string[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    allPaths.push(...getLocalizedPaths(criticalPaths, locale));
  }

  return allPaths;
}
