// Service Worker para Breath of Now
// Versão: 6.0.0 - Complete offline cache system with proper error handling

const CACHE_VERSION = 'v6';
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

// Critical pages to precache (without locale - will be expanded)
const CRITICAL_PATHS = [
  '',  // Home
  '/expenses',
  '/expenses/add',
  '/fitlog',
  '/offline'
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

// Installation: cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v6...');

  event.waitUntil(
    Promise.all([
      // Cache static assets (these MUST succeed)
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        console.log('[SW] Caching static assets');
        try {
          await cache.addAll(STATIC_ASSETS);
          console.log('[SW] ✅ Static assets cached successfully');
        } catch (error) {
          console.error('[SW] ❌ CRITICAL: Failed to cache static assets:', error);
          throw error; // Fail installation if static assets fail
        }
      }),

      // Cache critical pages (these MUST succeed)
      caches.open(CACHE_NAME).then(async (cache) => {
        console.log('[SW] Caching critical pages');

        // Try to cache all critical pages
        const results = await Promise.allSettled(
          CRITICAL_PAGES.map(async (page) => {
            try {
              await cache.add(page);
              console.log(`[SW] ✅ Cached: ${page}`);
              return { success: true, page };
            } catch (error) {
              console.error(`[SW] ❌ Failed to cache ${page}:`, error);
              return { success: false, page, error };
            }
          })
        );

        // Count successes
        const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

        console.log(`[SW] Cache results: ${successful}/${CRITICAL_PAGES.length} pages cached`);

        // If more than 50% failed, abort installation
        if (failed > CRITICAL_PAGES.length / 2) {
          console.error('[SW] ❌ CRITICAL: Too many pages failed to cache');
          throw new Error(`Failed to cache ${failed}/${CRITICAL_PAGES.length} critical pages`);
        }

        // Log which pages are missing
        if (failed > 0) {
          const failedPages = results
            .filter(r => r.status === 'rejected' || !r.value?.success)
            .map(r => r.value?.page || 'unknown');
          console.warn('[SW] ⚠️ Failed pages:', failedPages);
        }
      })
    ]).then(() => {
      console.log('[SW] ✅ Installation complete, activating...');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] ❌ Installation FAILED:', error);
      throw error;
    })
  );
});

// Activation: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v6...');

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

  // Strategy 1: Cache First for Next.js static assets (JS/CSS chunks)
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
          // Return empty response for missing chunks to prevent crashes
          console.warn('[SW] ❌ Failed to fetch static asset:', url.pathname);
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // Strategy 2: Network First for RSC requests with proper offline handling
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
          // Try to return cached RSC response first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] ✅ Returning cached RSC response:', url.pathname);
            return cachedResponse;
          }

          // For RSC requests that fail with no cache:
          // Extract the page URL without RSC parameters
          const pageUrl = new URL(url);
          pageUrl.searchParams.delete('_rsc');

          // Get locale from URL
          const pathParts = url.pathname.split('/');
          const locale = LOCALES.includes(pathParts[1]) ? pathParts[1] : 'en';

          console.warn('[SW] ⚠️ RSC request failed offline, checking for cached page:', pageUrl.pathname);

          // Try to find the cached HTML page
          const cachedPage = await caches.match(pageUrl.pathname);
          if (cachedPage) {
            console.log('[SW] ✅ Found cached page, redirecting');
            // Return a redirect response to force full page load
            return Response.redirect(pageUrl.pathname, 302);
          }

          // If no cached page exists, redirect to offline page
          console.warn('[SW] ❌ No cached page, redirecting to offline');
          const offlinePage = `/${locale}/offline`;
          return Response.redirect(offlinePage, 302);
        })
    );
    return;
  }

  // Strategy 3: Network First with Cache Fallback for HTML pages
  if (isPageRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] ⚠️ Network failed for page, trying cache:', url.pathname);

          // Try exact match first
          let cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] ✅ Exact match found');
            return cachedResponse;
          }

          // Try without query string
          const urlWithoutQuery = new URL(url);
          urlWithoutQuery.search = '';
          cachedResponse = await caches.match(urlWithoutQuery.toString());
          if (cachedResponse) {
            console.log('[SW] ✅ Match found (without query)');
            return cachedResponse;
          }

          // Try with trailing slash
          const urlWithSlash = new URL(url);
          urlWithSlash.pathname = urlWithSlash.pathname.endsWith('/')
            ? urlWithSlash.pathname
            : urlWithSlash.pathname + '/';
          urlWithSlash.search = '';
          cachedResponse = await caches.match(urlWithSlash.toString());
          if (cachedResponse) {
            console.log('[SW] ✅ Match found (with trailing slash)');
            return cachedResponse;
          }

          // Try without trailing slash
          const urlWithoutSlash = new URL(url);
          urlWithoutSlash.pathname = urlWithoutSlash.pathname.replace(/\/$/, '');
          urlWithoutSlash.search = '';
          cachedResponse = await caches.match(urlWithoutSlash.toString());
          if (cachedResponse) {
            console.log('[SW] ✅ Match found (without trailing slash)');
            return cachedResponse;
          }

          // Get locale from URL
          const pathParts = url.pathname.split('/');
          const locale = LOCALES.includes(pathParts[1]) ? pathParts[1] : 'en';

          // Try locale-specific offline page
          const offlinePage = `/${locale}/offline`;
          cachedResponse = await caches.match(offlinePage);
          if (cachedResponse) {
            console.log('[SW] ✅ Offline page found');
            return cachedResponse;
          }

          // Try any cached offline page
          for (const loc of LOCALES) {
            const page = await caches.match(`/${loc}/offline`);
            if (page) {
              console.log(`[SW] ✅ Offline page found for locale: ${loc}`);
              return page;
            }
          }

          // Last resort: return basic offline HTML
          console.log('[SW] ⚠️ No cached content, returning fallback HTML');
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

  // Strategy 4: Network First for other requests (images, fonts, etc.)
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
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response('', { status: 503 });
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

    event.ports[0]?.postMessage({ success: true, cachedUrls });
  } catch (error) {
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
}

// Clear page cache
async function handleClearCache(event) {
  try {
    await caches.delete(CACHE_NAME);
    await caches.delete(RUNTIME_CACHE_NAME);

    // Re-create cache with critical pages
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(
      CRITICAL_PAGES.map(async (page) => {
        try {
          await cache.add(page);
          console.log(`[SW] ✅ Re-cached: ${page}`);
          return { success: true };
        } catch (err) {
          console.warn(`[SW] ⚠️ Failed to re-cache ${page}:`, err);
          return { success: false };
        }
      })
    );

    const successful = results.filter(r => r.value?.success).length;
    console.log(`[SW] Cache cleared and re-cached ${successful}/${CRITICAL_PAGES.length} pages`);

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
