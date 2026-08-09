import { createFileRoute } from "@tanstack/react-router"

import { getChannel, toPublicChannel } from "@/lib/store"

export const Route = createFileRoute("/api/channel/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const channel = getChannel(params.name)
        if (!channel) {
          return Response.json({ error: "Channel not found." }, { status: 404 })
        }
        return Response.json(toPublicChannel(channel))
      },
    },
  },
})
