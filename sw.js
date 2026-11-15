const CACHE_NAME = 'snudifo30-v3.1-outils-editables';
const APP_FILES = ['./','./index.html','./styles.css','./app.js','./article-content.js','./manifest.webmanifest','./content/news.json','./content/events.json','./content/tools.json','./assets/logo-snudi-original.jpg','./assets/icon-snudi-relief-192.png','./assets/icon-snudi-relief-512.png','./assets/icon-snudi-relief-maskable-512.png','./assets/apple-touch-icon-snudi-relief-180.png','./assets/favicon-snudi-relief-48.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
 event.respondWith(fetch(req).then(resp => { if(resp.ok) {const copy=resp.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy));} return resp; }).catch(() => caches.match(req).then(x => x || (req.mode === 'navigate'?caches.match('./index.html'):undefined))));
});
