/* notify.me service worker — rich push + lock-screen inbox */

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
    link: "",
    createdAt: Date.now(),
    name: "",
    imageUrl: "",
    mediaUrl: "",
    mediaType: "image",
  }

  try {
    if (event.data) {
      const data = event.data.json()
      payload = {
        id: typeof data.id === "string" ? data.id : payload.id,
        title: typeof data.title === "string" ? data.title : payload.title,
        body: typeof data.body === "string" ? data.body : payload.body,
        url: typeof data.url === "string" ? data.url : payload.url,
        link: typeof data.link === "string" ? data.link : payload.link,
        createdAt:
          typeof data.createdAt === "number" ? data.createdAt : payload.createdAt,
        name: typeof data.name === "string" ? data.name : payload.name,
        imageUrl:
          typeof data.imageUrl === "string" ? data.imageUrl : payload.imageUrl,
        mediaUrl:
          typeof data.mediaUrl === "string" ? data.mediaUrl : payload.mediaUrl,
        mediaType:
          data.mediaType === "video" || data.mediaType === "image"
            ? data.mediaType
            : payload.mediaType,
      }
    }
  } catch {
    // keep defaults
  }

  const options: Record<string, unknown> = {
    body: payload.body,
    icon: payload.imageUrl || "/logo192.png",
    badge: "/logo192.png",
    data: {
      url: payload.url,
      id: payload.id,
      name: payload.name,
      createdAt: payload.createdAt,
      link: payload.link,
      imageUrl: payload.imageUrl,
      mediaUrl: payload.mediaUrl,
      mediaType: payload.mediaType,
    },
  }
  if (payload.mediaUrl && payload.mediaType !== "video") {
    options.image = payload.mediaUrl
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title, options)

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
            url: payload.link || undefined,
            imageUrl: payload.imageUrl || undefined,
            mediaUrl: payload.mediaUrl || undefined,
            mediaType: payload.mediaType || undefined,
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
  const data = event.notification.data || {}
  const targetUrl = data.url || "/"

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
