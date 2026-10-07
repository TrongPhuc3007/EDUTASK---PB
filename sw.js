/**
 * EDUTASK PRO — SERVICE WORKER (V11.8)
 * Hỗ trợ bộ nhớ đệm ngoại tuyến (Offline cache) và khởi động tức thì đa nền tảng.
 */

const CACHE_NAME = 'edutask-v11.8-cache';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/canvas.css',
  './js/cloud-sync.js',
  './js/github-sync.js',
  './js/store.js',
  './js/auth.js',
  './js/gateway.js',
  './js/anticheat.js',
  './js/grader.js',
  './js/admin.js',
  './js/tutor.js',
  './js/student.js',
  './js/parent.js',
  './js/app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets v6...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Cache addAll warning (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu không phải GET
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  
  // TUYỆT ĐỐI BỎ QUA mọi yêu cầu bên ngoài (GitHub API, raw.githubusercontent.com, Firebase, Google APIs, CDN)
  // để mạng gọi trực tiếp, không bị Service Worker chặn hay trả về dữ liệu cũ
  if (url.origin !== self.location.origin) {
    return;
  }

  // Không cache file cơ sở dữ liệu nếu có fetch cục bộ
  if (url.pathname.includes('edutask_database.json')) {
    return;
  }

  // Network First, fallback to Cache for local app assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
