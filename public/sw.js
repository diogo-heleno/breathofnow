// Service Worker para Breath of Now
// Versão: 8.0.0 - Fix offline navigation loops

const CACHE_VERSION = 'v8';
const CACHE_NAME = `breathofnow-pages-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `breathofnow-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `breathofnow-runtime-${CACHE_VERSION}`;

// Supported locales
const LOCALES = ['en', 'pt', 'es', 'fr'];

// Static assets that must be cached for offline
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Pages that CAN be statically generated (server components only)
// These are safe to pre-cache during install
const STATIC_PAGES = [
  '',           // Home (if server-side)
  '/offline',   // Offline page
  '/pricing',   // Static pages
  '/faq',
  '/privacy',
  '/terms'
];

// Client-side pages ('use client') that MUST be cached at runtime
// These cannot be pre-cached because they don't exist as static HTML
const CLIENT_PAGES = [
  '/expenses',
  '/expenses/add',
  '/expenses/transactions',
  '/expenses/categories',
  '/expenses/reports',
  '/expenses/settings',
  '/expenses/budgets',
  '/expenses/import',
  '/fitlog',
  '/fitlog/workout',
  '/fitlog/history',
  '/fitlog/plans',
  '/fitlog/create',
  '/account',
  '/account/settings'
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

// Only static pages for precache (during install)
const PRECACHE_PAGES = getLocalizedPaths(STATIC_PAGES);

// Client pages for runtime caching and warmup
const RUNTIME_PAGES = getLocalizedPaths(CLIENT_PAGES);

// All pages combined (for status reporting)
const ALL_PAGES = [...PRECACHE_PAGES, ...RUNTIME_PAGES];

// Check if request is for a Next.js static asset (JS/CSS chunks)
function isNextStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/');
}

// Check if request is for an RSC payload (React Server Components)
function isRSCRequest(request) {
  return request.headers.get('RSC') === '1' ||
         request.headers.get('Next-Router-State-Tree') !== null ||
         request.url.includes('_rsc=');
}

// Check if request is for a page (HTML)
function isPageRequest(request) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

// Installation: cache ONLY static assets and truly static pages
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v8 (Fix offline navigation loops)...');

  event.waitUntil(
    Promise.all([
      // Cache static assets (manifest, icons)
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        console.log('[SW] Caching static assets');
        try {
          await cache.addAll(STATIC_ASSETS);
          console.log('[SW] ✅ Static assets cached successfully');
        } catch (error) {
          console.error('[SW] ⚠️ Static assets failed:', error);
          // Don't fail install for this
        }
      }),

      // Cache ONLY truly static pages (server-rendered)
      caches.open(CACHE_NAME).then(async (cache) => {
        console.log('[SW] Caching static pages (server-rendered only)');

        const results = await Promise.allSettled(
          PRECACHE_PAGES.map(async (page) => {
            try {
              const response = await fetch(page, {
                credentials: 'same-origin',
                headers: { 'Accept': 'text/html' }
              });

              if (response.ok) {
                await cache.put(page, response);
                console.log(`[SW] ✅ Cached: ${page}`);
                return { success: true, page };
              } else {
                console.warn(`[SW] ⚠️ Skipped ${page}: HTTP ${response.status}`);
                return { success: false, page };
              }
            } catch (error) {
              console.warn(`[SW] ⚠️ Skipped ${page}:`, error.message);
              return { success: false, page };
            }
          })
        );

        const successful = results.filter(r => r.value?.success).length;
        console.log(`[SW] ✅ Cached ${successful}/${PRECACHE_PAGES.length} static pages`);
        console.log('[SW] 📝 Client pages will be cached on first visit or via warmup');
      })
    ]).then(() => {
      console.log('[SW] ✅ Installation complete');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] ⚠️ Installation completed with warnings:', error);
      // Still skip waiting - partial cache is better than no cache
      return self.skipWaiting();
    })
  );
});

// Activation: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v8...');

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
    }).then(() => {
      console.log('[SW] ✅ Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch handler with different strategies based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Get locale from URL for offline fallback
  const pathParts = url.pathname.split('/');
  const locale = LOCALES.includes(pathParts[1]) ? pathParts[1] : 'en';
  
  // Check if this is already the offline page - never redirect to avoid loops
  const isOfflinePage = url.pathname.includes('/offline');

  // Strategy 1: Cache First for Next.js static assets
  if (isNextStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // Strategy 2: Network First with AGGRESSIVE caching for RSC
  if (isRSCRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try cached RSC response
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] ✅ Using cached RSC:', url.pathname);
            return cachedResponse;
          }

          // Extract page URL without RSC params
          const pageUrl = new URL(url);
          pageUrl.searchParams.delete('_rsc');

          console.warn('[SW] ⚠️ RSC offline, checking cached page:', pageUrl.pathname);

          // Try to find cached HTML page
          const cachedPage = await caches.match(pageUrl.pathname);
          if (cachedPage) {
            console.log('[SW] ✅ Redirecting to cached page');
            return Response.redirect(pageUrl.pathname, 302);
          }

          // If already on offline page, don't redirect - return error to let client handle
          if (isOfflinePage) {
            console.log('[SW] ⚠️ Already offline page, returning error response');
            return new Response('Page not cached', { status: 503 });
          }

          // No cache - redirect to offline
          console.warn('[SW] ❌ No cache, redirecting to offline page');
          const offlinePage = `/${locale}/offline`;
          return Response.redirect(offlinePage, 302);
        })
    );
    return;
  }

  // Strategy 3: Network First with AGGRESSIVE caching and fallback for pages
  if (isPageRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // AGGRESSIVE: Cache ALL successful HTML responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              console.log('[SW] ✅ Runtime cached:', url.pathname);
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] ⚠️ Offline - trying cache for:', url.pathname);

          // Try multiple URL variations
          const urlVariations = [
            request.url,
            url.pathname,
            url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname + '/',
          ];

          for (const urlToTry of urlVariations) {
            const cached = await caches.match(urlToTry);
            if (cached) {
              console.log('[SW] ✅ Cache hit:', urlToTry);
              return cached;
            }
          }

          console.log('[SW] ❌ No cache found for:', url.pathname);

          // If already on offline page, don't redirect or serve offline page again
          // Just return an error to let the client handle it
          if (isOfflinePage) {
            console.log('[SW] ⚠️ Already on offline page, returning error');
            return new Response(getOfflineHTML(locale), {
              status: 503,
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              }
            });
          }

          // Try offline page from cache
          const offlinePage = `/${locale}/offline`;
          const offlineResponse = await caches.match(offlinePage);
          if (offlineResponse) {
            console.log('[SW] ✅ Redirecting to offline page');
            // Use redirect instead of serving inline to update URL
            return Response.redirect(offlinePage, 302);
          }

          // Last resort: inline HTML
          console.log('[SW] ⚠️ Using fallback offline HTML');
          return new Response(getOfflineHTML(locale), {
            status: 503,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache'
            }
          });
        })
    );
    return;
  }

  // Strategy 4: Network First for other resources
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 503 });
      })
  );
});

// Generate basic offline HTML fallback
function getOfflineHTML(locale = 'en') {
  const messages = {
    en: {
      title: "You're Offline",
      description: "Don't worry! Your data is safely stored on your device. The app will reconnect automatically when you're back online.",
      button: "Try Again",
      status1: "Your data is safe locally",
      status2: "Changes will sync when online"
    },
    pt: {
      title: "Está Offline",
      description: "Não se preocupe! Os seus dados estão guardados em segurança no seu dispositivo. A app vai reconectar automaticamente quando voltar online.",
      button: "Tentar Novamente",
      status1: "Os seus dados estão seguros localmente",
      status2: "As alterações serão sincronizadas quando online"
    },
    es: {
      title: "Estás Sin Conexión",
      description: "¡No te preocupes! Tus datos están guardados de forma segura en tu dispositivo. La app se reconectará automáticamente cuando vuelvas a estar online.",
      button: "Intentar de Nuevo",
      status1: "Tus datos están seguros localmente",
      status2: "Los cambios se sincronizarán cuando estés online"
    },
    fr: {
      title: "Vous êtes Hors Ligne",
      description: "Ne vous inquiétez pas ! Vos données sont stockées en toute sécurité sur votre appareil. L'application se reconnectera automatiquement lorsque vous serez de nouveau en ligne.",
      button: "Réessayer",
      status1: "Vos données sont en sécurité localement",
      status2: "Les modifications seront synchronisées en ligne"
    }
  };

  const msg = messages[locale] || messages.en;

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Breath of Now</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f5f0 0%, #e8e4d9 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #fef3c7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: #f59e0b;
    }
    h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    button {
      background: #5a7d5a;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #4a6d4a;
    }
    .status {
      margin-top: 20px;
      padding: 12px;
      background: #f0fdf4;
      border-radius: 8px;
      color: #166534;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
    </div>
    <h1>${msg.title}</h1>
    <p>${msg.description}</p>
    <button onclick="window.location.reload()">${msg.button}</button>
    <div class="status">
      ✓ ${msg.status1}<br>
      ✓ ${msg.status2}
    </div>
  </div>
  <script>
    // Auto-reload when back online
    window.addEventListener('online', () => {
      window.location.reload();
    });
  </script>
</body>
</html>`;
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncDataWithServer());
  }
});

async function syncDataWithServer() {
  try {
    console.log('[SW] Syncing data with server...');
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

    case 'WARMUP_CACHE':
      handleWarmupCache(event);
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

    case 'CACHE_ASSETS':
      handleCacheAssets(event);
      break;

    default:
      break;
  }
});

// Warmup cache by visiting client pages in background
async function handleWarmupCache(event) {
  console.log('[SW] 🔥 Starting cache warmup...');

  const cache = await caches.open(CACHE_NAME);
  let cached = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of RUNTIME_PAGES) {
    try {
      // Check if already cached
      const existing = await cache.match(page);
      if (existing) {
        console.log(`[SW] ⏭️ Already cached: ${page}`);
        skipped++;
        cached++;
        continue;
      }

      // Fetch and cache
      const response = await fetch(page, {
        credentials: 'same-origin',
        headers: { 'Accept': 'text/html' }
      });

      if (response.ok) {
        await cache.put(page, response);
        console.log(`[SW] ✅ Warmed up: ${page}`);
        cached++;

        // Send progress update
        event.ports[0]?.postMessage({
          type: 'WARMUP_PROGRESS',
          cached,
          total: RUNTIME_PAGES.length,
          page
        });
      } else {
        console.warn(`[SW] ⚠️ Skip ${page}: HTTP ${response.status}`);
        failed++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`[SW] ❌ Failed to warmup ${page}:`, error);
      failed++;
    }
  }

  console.log(`[SW] 🔥 Warmup complete: ${cached} cached (${skipped} already), ${failed} failed`);

  event.ports[0]?.postMessage({
    type: 'WARMUP_COMPLETE',
    success: cached,
    failed: failed,
    skipped: skipped
  });
}

// Cache a specific page and its assets
async function handleCachePage(event, payload) {
  const { url } = payload || {};

  if (!url) {
    event.ports[0]?.postMessage({ success: false, error: 'No URL provided' });
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAME);

    // Try to fetch with retry
    let response;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(url, {
          credentials: 'same-origin',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (response.ok) {
          break;
        }
      } catch (error) {
        lastError = error;
        console.warn(`[SW] Attempt ${attempt} failed for ${url}:`, error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (response && response.ok) {
      await cache.put(url, response.clone());

      // Also cache any JS/CSS from the response
      const text = await response.text();
      const assetUrls = extractAssetUrls(text);

      const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);
      await Promise.allSettled(
        assetUrls.map(async (assetUrl) => {
          try {
            const assetResponse = await fetch(assetUrl);
            if (assetResponse.ok) {
              await runtimeCache.put(assetUrl, assetResponse);
            }
          } catch (e) {
            // Ignore individual asset failures
          }
        })
      );

      console.log(`[SW] ✅ Cached page: ${url}`);
      event.ports[0]?.postMessage({ success: true });
    } else {
      console.error(`[SW] ❌ Failed to cache page: ${url}`);
      event.ports[0]?.postMessage({ success: false, error: lastError?.message || `HTTP ${response?.status}` });
    }
  } catch (error) {
    console.error(`[SW] ❌ Error caching page: ${url}`, error);
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}

// Extract JS/CSS URLs from HTML
function extractAssetUrls(html) {
  const urls = [];

  // Match script src
  const scriptMatches = html.matchAll(/src="(\/_next\/static\/[^"]+)"/g);
  for (const match of scriptMatches) {
    urls.push(match[1]);
  }

  // Match link href
  const linkMatches = html.matchAll(/href="(\/_next\/static\/[^"]+)"/g);
  for (const match of linkMatches) {
    urls.push(match[1]);
  }

  return urls;
}

// Get list of cached URLs
async function handleGetCacheStatus(event) {
  try {
    const pageCache = await caches.open(CACHE_NAME);
    const pageKeys = await pageCache.keys();

    const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);
    const runtimeKeys = await runtimeCache.keys();

    const cachedUrls = [
      ...pageKeys.map(k => k.url),
      ...runtimeKeys.map(k => k.url)
    ];

    event.ports[0]?.postMessage({
      success: true,
      cachedUrls,
      allPages: ALL_PAGES,
      staticPages: PRECACHE_PAGES,
      clientPages: RUNTIME_PAGES
    });
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}

// Clear page cache and re-cache static pages only
async function handleClearCache(event) {
  try {
    await caches.delete(CACHE_NAME);
    await caches.delete(RUNTIME_CACHE_NAME);

    // Re-create cache with static pages only
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(
      PRECACHE_PAGES.map(async (page) => {
        try {
          const response = await fetch(page, {
            credentials: 'same-origin',
            headers: { 'Accept': 'text/html' }
          });
          if (response.ok) {
            await cache.put(page, response);
            console.log(`[SW] ✅ Re-cached: ${page}`);
            return { success: true };
          }
          return { success: false };
        } catch (err) {
          console.warn(`[SW] ⚠️ Failed to re-cache ${page}:`, err);
          return { success: false };
        }
      })
    );

    const successful = results.filter(r => r.value?.success).length;
    console.log(`[SW] Cache cleared and re-cached ${successful}/${PRECACHE_PAGES.length} static pages`);
    console.log('[SW] 📝 Client pages will be cached on next visit or via warmup');

    event.ports[0]?.postMessage({ success: true });
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}

// Cache current page assets
async function handleCacheAssets(event) {
  try {
    const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);

    // Get all cached requests and refresh them
    const keys = await runtimeCache.keys();
    await Promise.allSettled(
      keys.map(async (request) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await runtimeCache.put(request, response);
          }
        } catch (e) {
          // Keep existing cached version
        }
      })
    );

    event.ports[0]?.postMessage({ success: true });
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}
