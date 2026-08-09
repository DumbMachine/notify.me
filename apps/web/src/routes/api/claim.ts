import { createFileRoute } from "@tanstack/react-router"

import { claimName, toPublicChannel } from "@/lib/store"

export const Route = createFileRoute("/api/claim")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 })
        }

        const name =
          typeof body === "object" &&
          body !== null &&
          "name" in body &&
          typeof (body as { name: unknown }).name === "string"
            ? (body as { name: string }).name
            : ""

        const result = claimName(name)
        if (!result.ok) {
          return Response.json({ error: result.error }, { status: result.status })
        }

        const origin = new URL(request.url).origin

        return Response.json({
          ...toPublicChannel(result.channel),
          apiKey: result.channel.apiKey,
          notifyUrl: `${origin}/api/notify/${result.channel.name}`,
          connectUrl: `${origin}/connect/${result.channel.name}`,
          dashboardUrl: `${origin}/${result.channel.name}`,
        })
      },
    },
  },
})
