// Service worker mínimo: hace la app instalable. No cachea datos (la app es dinámica y autenticada).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
