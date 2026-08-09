import { createFileRoute } from "@tanstack/react-router"

import { isPushSubscription } from "@/lib/push"
import {
  ensureChannel,
  getChannel,
  setSubscription,
  toPublicChannel,
} from "@/lib/store"

export const Route = createFileRoute("/api/channel/$name/subscribe")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 })
        }

        const apiKey =
          typeof body === "object" &&
          body !== null &&
          "apiKey" in body &&
          typeof (body as { apiKey: unknown }).apiKey === "string"
            ? (body as { apiKey: string }).apiKey
            : new URL(request.url).searchParams.get("k") ?? ""

        const subscription =
          typeof body === "object" &&
          body !== null &&
          "subscription" in body
            ? (body as { subscription: unknown }).subscription
            : body

        if (apiKey) {
          const ensured = await ensureChannel(params.name, apiKey)
          if (!ensured.ok) {
            return Response.json(
              { error: ensured.error },
              { status: ensured.status }
            )
          }
        } else {
          const channel = await getChannel(params.name)
          if (!channel) {
            return Response.json(
              { error: "Channel not found." },
              { status: 404 }
            )
          }
        }

        if (!isPushSubscription(subscription)) {
          return Response.json(
            { error: "Invalid push subscription." },
            { status: 400 }
          )
        }

        const updated = await setSubscription(params.name, subscription)
        if (!updated) {
          return Response.json({ error: "Channel not found." }, { status: 404 })
        }

        return Response.json(toPublicChannel(updated))
      },
    },
  },
})
