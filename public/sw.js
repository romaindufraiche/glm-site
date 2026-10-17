// L'ancien site installait un service worker qui gardait les pages en cache.
// Ce fichier le remplace : il vide ses caches, se désinstalle et recharge les onglets ouverts,
// pour que les visiteurs déjà venus voient bien le nouveau site.
// Il peut être supprimé quelques mois après la mise en ligne de la refonte.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
