// Service Worker para Notificaciones Push en Web (Flor de Loto)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Evento al hacer clic en la notificación en el celular o PC
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin/pedidos';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar si ya hay una pestaña del administrador abierta
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir la sección de pedidos
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Evento para recibir notificaciones push desde el servidor (Web Push API)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "🌸 ¡Nuevo Pedido Recibido!";
    const options = {
      body: data.body || "Se ha recibido una nueva compra en Flor de Loto.",
      icon: data.icon || "/LogoSinLetra.png",
      badge: "/LogoSinLetra.png",
      data: { url: data.url || "/admin/pedidos" },
      vibrate: [200, 100, 200, 100, 200],
      tag: "nuevo-pedido-" + (data.id || Date.now()),
      renotify: true,
      requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Error al procesar notificación en Service Worker:", err);
  }
});
