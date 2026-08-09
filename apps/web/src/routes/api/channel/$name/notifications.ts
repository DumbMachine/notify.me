import { createFileRoute } from "@tanstack/react-router"

import { authenticateChannel, listNotifications } from "@/lib/store"

function getApiKey(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (header) {
    const [scheme, token] = header.split(" ")
    if (scheme?.toLowerCase() === "bearer" && token) return token
  }
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get("k")
  return fromQuery || null
}

export const Route = createFileRoute("/api/channel/$name/notifications")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const apiKey = getApiKey(request)
        if (!apiKey) {
          return Response.json({ error: "Unauthorized." }, { status: 401 })
        }

        const auth = await authenticateChannel(params.name, apiKey)
        if (!auth.ok) {
          return Response.json({ error: auth.error }, { status: auth.status })
        }

        const notifications = (await listNotifications(params.name)) ?? []
        return Response.json({
          name: auth.channel.name,
          connected: Boolean(auth.channel.subscription),
          notifications,
        })
      },
    },
  },
})
