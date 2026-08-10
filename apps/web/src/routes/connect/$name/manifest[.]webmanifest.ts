import { createFileRoute } from "@tanstack/react-router"

import { normalizeName } from "@/lib/store"

export const Route = createFileRoute("/connect/$name/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const name = normalizeName(params.name)
        const appName = `notify.me/${name}`

        // Static fallback before the client injects a manifest with ?k= in
        // start_url. Served under /connect/:name/ so "." scopes correctly.
        const manifest = {
          id: `.`,
          name: appName,
          short_name: name,
          description: `Push notifications for ${name}`,
          start_url: ".",
          scope: ".",
          display: "standalone",
          orientation: "portrait-primary",
          theme_color: "#000000",
          background_color: "#000000",
          icons: [
            {
              src: "/icon.svg",
              type: "image/svg+xml",
              sizes: "any",
              purpose: "any",
            },
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
              purpose: "any maskable",
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
