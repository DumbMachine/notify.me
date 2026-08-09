import { createFileRoute } from "@tanstack/react-router"

import { isPushSubscription } from "@/lib/push"
import { getChannel, setSubscription, toPublicChannel } from "@/lib/store"

export const Route = createFileRoute("/api/channel/$name/subscribe")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const channel = getChannel(params.name)
        if (!channel) {
          return Response.json({ error: "Channel not found." }, { status: 404 })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 })
        }

        if (!isPushSubscription(body)) {
          return Response.json(
            { error: "Invalid push subscription." },
            { status: 400 }
          )
        }

        const updated = setSubscription(params.name, body)
        if (!updated) {
          return Response.json({ error: "Channel not found." }, { status: 404 })
        }

        return Response.json(toPublicChannel(updated))
      },
    },
  },
})
