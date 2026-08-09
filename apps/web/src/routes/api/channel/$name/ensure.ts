import { createFileRoute } from "@tanstack/react-router"

import { ensureChannel, normalizeName } from "@/lib/store"

export const Route = createFileRoute("/api/channel/$name/ensure")({
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
            : ""

        const result = await ensureChannel(params.name, apiKey)
        if (!result.ok) {
          return Response.json({ error: result.error }, { status: result.status })
        }

        return Response.json({
          name: normalizeName(params.name),
          connected: Boolean(result.channel.subscription),
          createdAt: result.channel.createdAt,
        })
      },
    },
  },
})
