import { createFileRoute } from "@tanstack/react-router"

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

        const title =
          typeof body === "object" &&
          body !== null &&
          "title" in body &&
          typeof (body as { title: unknown }).title === "string"
            ? (body as { title: string }).title.trim()
            : ""

        if (!title) {
          return Response.json(
            { error: "Field `title` is required." },
            { status: 400 }
          )
        }

        const messageBody =
          typeof body === "object" &&
          body !== null &&
          "body" in body &&
          typeof (body as { body: unknown }).body === "string"
            ? (body as { body: string }).body
            : undefined

        const url =
          typeof body === "object" &&
          body !== null &&
          "url" in body &&
          typeof (body as { url: unknown }).url === "string"
            ? (body as { url: string }).url
            : undefined

        const result = await sendPushToChannel(channel, {
          title,
          body: messageBody,
          url,
        })

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
