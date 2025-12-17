// Service Worker para Breath of Now
// Versão: 3.0.0 - PWA Cache Management

const CACHE_VERSION = 'v3';
const CACHE_NAME = `breathofnow-pages-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `breathofnow-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `breathofnow-runtime-${CACHE_VERSION}`;

// Supported locales
const LOCALES = ['en', 'pt', 'es', 'fr'];

// Critical assets for offline functionality
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline'
];

// Critical pages to precache (without locale - will be expanded)
const CRITICAL_PATHS = [
  '',  // Home
  '/expenses',
  '/expenses/add',
  '/fitlog'
];

// Generate localized paths
function getLocalizedPaths(paths) {
  const result = [];
  for (const locale of LOCALES) {
    for (const path of paths) {
      result.push(`/${locale}${path}`);
    }
  }
  return result;
}

// All critical pages with locales
const CRITICAL_PAGES = getLocalizedPaths(CRITICAL_PATHS);

// Installation: cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v3...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('[SW] Some static assets failed to cache:', error);
        });
      }),
      // Cache critical pages
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching critical pages');
        return cache.addAll(CRITICAL_PAGES).catch((error) => {
          console.warn('[SW] Some critical pages failed to cache:', error);
        });
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activation: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old version caches
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== RUNTIME_CACHE_NAME &&
            cacheName.startsWith('breathofnow-')
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (APIs, etc)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Strategy: Network First, Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();

          // Determine which cache to use
          const isPage = request.headers.get('accept')?.includes('text/html');
          const cacheName = isPage ? CACHE_NAME : RUNTIME_CACHE_NAME;

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }

        // If it's a page request, try to serve offline page
        if (request.headers.get('accept')?.includes('text/html')) {
          // Try locale-specific offline page
          const pathParts = url.pathname.split('/');
          const locale = LOCALES.includes(pathParts[1]) ? pathParts[1] : 'en';

          const offlinePage = await caches.match(`/${locale}/offline`) ||
                              await caches.match('/offline');

          if (offlinePage) {
            return offlinePage;
          }

          // Fallback to home page
          const homePage = await caches.match(`/${locale}`);
          if (homePage) {
            return homePage;
          }
        }

        // Return a basic offline response
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Background sync (when back online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncDataWithServer());
  }
});

async function syncDataWithServer() {
  try {
    console.log('[SW] Syncing data with server...');
    // TODO: Implement data sync with Supabase
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    return Promise.reject(error);
  }
}

// Message handler for cache operations from the app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_PAGE':
      handleCachePage(event, payload);
      break;

    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(event);
      break;

    case 'CLEAR_CACHE':
      handleClearCache(event);
      break;

    default:
      break;
  }
});

// Cache a specific page
async function handleCachePage(event, payload) {
  const { url } = payload || {};

  if (!url) {
    event.ports[0]?.postMessage({ success: false, error: 'No URL provided' });
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);

    if (response.ok) {
      await cache.put(url, response);
      event.ports[0]?.postMessage({ success: true });
    } else {
      event.ports[0]?.postMessage({ success: false, error: `HTTP ${response.status}` });
    }
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}

// Get list of cached URLs
async function handleGetCacheStatus(event) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const cachedUrls = keys.map(k => k.url);

    event.ports[0]?.postMessage({ success: true, cachedUrls });
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}

// Clear page cache
async function handleClearCache(event) {
  try {
    await caches.delete(CACHE_NAME);
    // Re-create cache with critical pages
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CRITICAL_PAGES);

    event.ports[0]?.postMessage({ success: true });
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}
