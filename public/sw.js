// Service Worker para Breath of Now
// Versão: 1.0.0

const CACHE_NAME = 'breathofnow-v1';
const RUNTIME_CACHE = 'breathofnow-runtime-v1';

// Ficheiros críticos para funcionamento offline
const CRITICAL_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação: cachear assets críticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting()) // Ativar imediatamente
  );
});

// Ativação: limpar caches antigas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Controlar todas as páginas
  );
});

// Estratégia de caching: Network First com Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar pedidos non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar pedidos externos (APIs, etc)
  if (url.origin !== self.location.origin) {
    // Para Supabase e outras APIs: apenas network
    return;
  }

  // Estratégia: Network First, Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta é válida, guardar em cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Se network falhar, tentar cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
          }
          
          // Se for uma página HTML, mostrar página offline
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline');
          }
          
          // Para outros recursos, retornar erro
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aqui podes adicionar lógica para sincronizar dados
      // com o Supabase quando voltar online
      syncDataWithServer()
    );
  }
});

async function syncDataWithServer() {
  try {
    // TODO: Implementar sincronização com Supabase
    console.log('[SW] Syncing data with server...');
    
    // Exemplo: enviar dados pendentes do IndexedDB para Supabase
    // const pendingData = await getPendingData();
    // await uploadToSupabase(pendingData);
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    return Promise.reject(error);
  }
}

// Notificações (opcional - para avisar quando voltar online)
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
