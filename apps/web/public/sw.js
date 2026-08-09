/* notify.me service worker — push + lock-screen inbox sync */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = {
    id: "",
    title: "notify.me",
    body: "You have a new notification",
    url: "/",
    createdAt: Date.now(),
    name: "",
  }

  try {
    if (event.data) {
      const data = event.data.json()
      payload = {
        id: typeof data.id === "string" ? data.id : payload.id,
        title: typeof data.title === "string" ? data.title : payload.title,
        body: typeof data.body === "string" ? data.body : payload.body,
        url: typeof data.url === "string" ? data.url : payload.url,
        createdAt:
          typeof data.createdAt === "number" ? data.createdAt : payload.createdAt,
        name: typeof data.name === "string" ? data.name : payload.name,
      }
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: {
          url: payload.url,
          id: payload.id,
          name: payload.name,
          createdAt: payload.createdAt,
        },
      })

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      for (const client of clients) {
        client.postMessage({
          type: "notify.me:push",
          notification: {
            id: payload.id || `local-${payload.createdAt}`,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            createdAt: payload.createdAt,
            delivered: true,
          },
        })
      }
    })()
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
