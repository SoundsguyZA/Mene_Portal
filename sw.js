// MENE Portal Service Worker
const CACHE_NAME = 'mene-portal-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/agent-manager.js',
    '/js/pwa-utils.js',
    '/js/workers/chatgpt-worker.js',
    '/js/workers/claude-worker.js',
    '/js/workers/zai-worker.js',
    '/js/workers/gemini-worker.js',
    '/js/workers/custom-worker.js',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => {
                    // Handle root path
                    return url === '/' ? './index.html' : url;
                }));
            })
            .then(() => {
                console.log('All files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Skip cross-origin requests
    if (requestUrl.origin !== location.origin) {
        return;
    }

    // Handle different types of requests
    if (event.request.method === 'GET') {
        event.respondWith(handleGetRequest(event.request));
    }
});

async function handleGetRequest(request) {
    const url = new URL(request.url);

    // For HTML pages, use Network First strategy
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        return networkFirstStrategy(request);
    }

    // For static assets, use Cache First strategy
    if (isStaticAsset(url.pathname)) {
        return cacheFirstStrategy(request);
    }

    // For API calls and external resources, use Network Only
    return networkOnlyStrategy(request);
}

function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.json'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Network First Strategy
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseClone);
        }

        return networkResponse;
    } catch (error) {
        console.log('Network failed, falling back to cache:', error);
        const cacheResponse = await caches.match(request);

        if (cacheResponse) {
            return cacheResponse;
        }

        // Return offline page if available
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }

        return new Response('Network error and no cache available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Cache First Strategy
async function cacheFirstStrategy(request) {
    const cacheResponse = await caches.match(request);

    if (cacheResponse) {
        return cacheResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseClone);
        }

        return networkResponse;
    } catch (error) {
        console.log('Network and cache failed:', error);
        return new Response('Resource not available', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// Network Only Strategy
async function networkOnlyStrategy(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.log('Network request failed:', error);
        return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-messages') {
        event.waitUntil(syncOfflineMessages());
    }
});

async function syncOfflineMessages() {
    try {
        // Get offline messages from IndexedDB or localStorage
        const offlineMessages = await getOfflineMessages();

        for (const message of offlineMessages) {
            try {
                // Attempt to send message when online
                await sendMessage(message);
                // Remove from offline storage
                await removeOfflineMessage(message.id);
            } catch (error) {
                console.log('Failed to sync message:', error);
                // Keep message for next sync attempt
            }
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

async function getOfflineMessages() {
    // Placeholder - in real implementation, get from IndexedDB
    return [];
}

async function removeOfflineMessage(messageId) {
    // Placeholder - in real implementation, remove from IndexedDB
    console.log('Removing offline message:', messageId);
}

async function sendMessage(message) {
    // Placeholder - in real implementation, send to server
    console.log('Sending message:', message);
}

// Push Notifications (if needed)
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Open MENE Portal',
                    icon: '/assets/icons/icon-192x192.png'
                },
                {
                    action: 'close',
                    title: 'Close notification',
                    icon: '/assets/icons/icon-192x192.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification('MENE Portal', options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'GET_CACHE_KEYS':
                event.ports[0].postMessage({
                    type: 'CACHE_KEYS',
                    keys: Array.from(urlsToCache)
                });
                break;
            case 'CLEAR_CACHE':
                clearAllCaches().then(() => {
                    event.ports[0].postMessage({
                        type: 'CACHE_CLEARED',
                        success: true
                    });
                });
                break;
        }
    }
});

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// Error handling
self.addEventListener('error', (error) => {
    console.error('Service Worker error:', error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled promise rejection:', event.reason);
});

console.log('MENE Portal Service Worker loaded');