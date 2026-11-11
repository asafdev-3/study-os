const CACHE_PREFIX = 'studyos-offline-'
const CACHE_NAME = CACHE_PREFIX + 'v1'
const OFFLINE_PAGE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_PAGE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  )))
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return

  event.respondWith(fetch(event.request).catch(async () => {
    const offline = await caches.match(OFFLINE_PAGE, { cacheName: CACHE_NAME })
    return offline ?? Response.error()
  }))
})
