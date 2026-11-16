const CACHE_NAME = 'snudifo30-v3.14-images-integrales';
const APP_FILES = ['./','./index.html','./styles.css','./app.js','./article-content.js','./pdf-library.js','./pdf-reader.js','./youtube-videos.js','./manifest.webmanifest','./content/news.json','./content/events.json','./content/tools.json','./content/home.json','./assets/bandeau-elections-2026.png','./assets/logo-snudi-original.jpg','./assets/icon-snudi-relief-192.png','./assets/icon-snudi-relief-512.png','./assets/icon-snudi-relief-maskable-512.png','./assets/apple-touch-icon-snudi-relief-180.png','./assets/favicon-snudi-relief-48.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
 // Les PDF ne doivent pas survivre à leur suppression dans le cache hors ligne.
 if(new URL(req.url).pathname.includes('/media/pdfs/')){event.respondWith(fetch(req));return;}
 event.respondWith(fetch(req).then(resp => { if(resp.ok) {const copy=resp.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy));} return resp; }).catch(() => caches.match(req).then(x => x || (req.mode === 'navigate'?caches.match('./index.html'):undefined))));
});
