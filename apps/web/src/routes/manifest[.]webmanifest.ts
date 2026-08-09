import { createFileRoute } from "@tanstack/react-router"

import { normalizeName } from "@/lib/store"

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const rawName = url.searchParams.get("name")
        const name = rawName ? normalizeName(rawName) : null
        const hasName = Boolean(name && name.length >= 3)

        // Always bind install to /connect/:name when a name is present.
        // Do not require the in-memory channel — serverless instances may differ.
        const startUrl = hasName ? `/connect/${name}` : "/"
        const appName = hasName ? `notify.me/${name}` : "notify.me"

        const manifest = {
          id: hasName ? `/connect/${name}` : "/",
          name: appName,
          short_name: hasName ? name : "notify.me",
          description: hasName
            ? `Push notifications for ${name}`
            : "Claim a name and push notifications to your phone.",
          start_url: startUrl,
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          theme_color: "#0f766e",
          background_color: "#f7fbfa",
          icons: [
            {
              src: "/logo192.png",
              type: "image/png",
              sizes: "192x192",
              purpose: "any",
            },
            {
              src: "/logo512.png",
              type: "image/png",
              sizes: "512x512",
              purpose: "any",
            },
            {
              src: "/logo512.png",
              type: "image/png",
              sizes: "512x512",
              purpose: "maskable",
            },
          ],
        }

        return new Response(JSON.stringify(manifest, null, 2), {
          headers: {
            "content-type": "application/manifest+json; charset=utf-8",
            "cache-control": "no-store",
          },
        })
      },
    },
  },
})
