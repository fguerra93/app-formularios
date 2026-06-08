/* Service worker de la App del Dueño (Fase F6): recibe Web Push y abre /m. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "PrintUp", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "PrintUp";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag,
      data: { url: data.url || "/m" },
      icon: "/m/icon-192.png",
      badge: "/m/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/m";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes("/m") && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
