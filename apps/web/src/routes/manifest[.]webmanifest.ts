import { createFileRoute } from "@tanstack/react-router"

// Root manifest intentionally absent so Home Screen installs must happen
// from /connect/:name (which has start_url: ".").
export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          JSON.stringify({
            error:
              "Install notify.me from your /connect/:name page, not the homepage.",
          }),
          {
            status: 404,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        ),
    },
  },
})
