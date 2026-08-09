import { createFileRoute } from "@tanstack/react-router"

import { normalizeName } from "@/lib/store"

export const Route = createFileRoute("/connect/$name/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const name = normalizeName(params.name)
        const appName = `notify.me/${name}`

        // Served under /connect/:name/ so start_url "." resolves to this page,
        // which is what iOS needs for page-specific Home Screen installs.
        const manifest = {
          id: `.`,
          name: appName,
          short_name: name,
          description: `Push notifications for ${name}`,
          start_url: ".",
          scope: ".",
          display: "standalone",
          orientation: "portrait-primary",
          theme_color: "#0f1a18",
          background_color: "#0f1a18",
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
