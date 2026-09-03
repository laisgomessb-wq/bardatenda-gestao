// Desativação e limpeza de cache para garantir que a aplicação sempre carregue a versão mais recente
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Sempre repassa direto para a rede, nunca intercepta ou bloqueia assets
  event.respondWith(fetch(event.request));
});

