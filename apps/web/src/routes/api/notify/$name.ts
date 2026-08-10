import { createFileRoute } from "@tanstack/react-router"

import { parseNotifyPayload } from "@/lib/notify-payload"
import { sendPushToChannel } from "@/lib/push"
import { getChannel } from "@/lib/store"

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}

export const Route = createFileRoute("/api/notify/$name")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const channel = await getChannel(params.name)
        if (!channel) {
          return Response.json({ error: "Channel not found." }, { status: 404 })
        }

        const token = getBearerToken(request)
        if (!token || token !== channel.apiKey) {
          return Response.json({ error: "Unauthorized." }, { status: 401 })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 })
        }

        const parsed = parseNotifyPayload(body)
        if (!parsed.ok) {
          return Response.json({ error: parsed.error }, { status: 400 })
        }

        const result = await sendPushToChannel(channel, parsed.value)

        if (!result.ok) {
          return Response.json({ error: result.error }, { status: result.status })
        }

        return Response.json({
          ok: true,
          delivered: result.delivered,
          notification: result.notification,
        })
      },
    },
  },
})
