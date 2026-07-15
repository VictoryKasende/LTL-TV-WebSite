self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'LTL TV', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'LTL TV';
  const options = {
    body: data.body || '',
    // Android Chrome can't rasterize SVG for notification icons — falls back to
    // a blank circle. Use PNG here; the SVG stays as the favicon source.
    icon: data.icon || '/notification-icon-512.png',
    badge: '/notification-icon-192.png',
    image: data.image || undefined,
    data: { url: data.url || '/', campaignId: data.campaign_id || null },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, campaignId } = event.notification.data || {};
  const targetUrl = url || '/';

  event.waitUntil((async () => {
    if (campaignId) {
      try {
        await fetch(`/api/v1/notifications/campaigns/${campaignId}/click/`, { method: 'POST' });
      } catch (e) {
        // Best-effort click tracking — ignore network failures.
      }
    }

    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if (client.url === targetUrl && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  })());
});
