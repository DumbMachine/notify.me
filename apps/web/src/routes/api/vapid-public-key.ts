import { createFileRoute } from "@tanstack/react-router"

import { configureWebPush } from "@/lib/vapid"

export const Route = createFileRoute("/api/vapid-public-key")({
  server: {
    handlers: {
      GET: async () => {
        const keys = configureWebPush()
        return Response.json({ publicKey: keys.publicKey })
      },
    },
  },
})
