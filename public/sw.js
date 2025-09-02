// Service Worker for Spot Canvas - Background Sync & Caching
const CACHE_VERSION = 'v1';
const CACHE_NAME = `spotcanvas-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `spotcanvas-api-${CACHE_VERSION}`;

// URLs to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/chart',
  '/favicon.ico',
  '/site.webmanifest'
];

// API endpoints to cache
const API_ENDPOINTS = [
  'billing-server-346028322665.europe-west1.run.app/api/subscriptions'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS).catch((error) => {
        console.error('[SW] Failed to cache some assets:', error);
        // Continue installation even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('spotcanvas-') && 
              cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests with cache-first strategy
  if (url.hostname.includes('billing-server') && url.pathname.includes('/api/subscriptions')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (STATIC_CACHE_URLS.some(staticUrl => url.pathname === staticUrl)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetchAndCache(request, CACHE_NAME);
          return cachedResponse;
        }
        return fetchAndCache(request, CACHE_NAME);
      })
    );
    return;
  }
  
  // Network-first for everything else
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Handle API requests with intelligent caching
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first for API calls
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      
      // Notify clients of fresh data
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SUBSCRIPTION_UPDATED',
            timestamp: Date.now()
          });
        });
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, checking cache:', error);
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning cached API response');
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      subscriptions: [],
      offline: true,
      cached: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Fetch and cache helper
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-subscription') {
    event.waitUntil(syncSubscriptionData());
  }
});

// Sync subscription data when online
async function syncSubscriptionData() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Request fresh subscription data
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SUBSCRIPTION',
        timestamp: Date.now()
      });
    });
    
    console.log('[SW] Subscription sync completed');
  } catch (error) {
    console.error('[SW] Subscription sync failed:', error);
    throw error; // Retry later
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_SUBSCRIPTION':
      // Cache subscription data sent from client
      if (data && data.url && data.response) {
        caches.open(API_CACHE_NAME).then(cache => {
          const request = new Request(data.url);
          const response = new Response(JSON.stringify(data.response), {
            headers: { 'Content-Type': 'application/json' }
          });
          cache.put(request, response);
          console.log('[SW] Cached subscription data from client');
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      caches.keys().then(cacheNames => {
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('spotcanvas-')) {
              return caches.delete(cacheName);
            }
          })
        ).then(() => {
          console.log('[SW] All caches cleared');
          event.ports[0].postMessage({ success: true });
        });
      });
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'subscription-update') {
    console.log('[SW] Periodic sync for subscription data');
    event.waitUntil(syncSubscriptionData());
  }
});

console.log('[SW] Service worker loaded');