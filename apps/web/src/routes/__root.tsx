import { DirectionProvider } from "@workspace/ui/components/direction"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"

import appCss from "@workspace/ui/globals.css?url"

const SITE_NAME = "notify.me"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: SITE_NAME },
      {
        name: "description",
        content:
          "Claim a name, connect your phone, and push notifications to it with a simple API.",
      },
      { name: "theme-color", content: "#0f766e" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: SITE_NAME },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-3 px-6">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <a href="/" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to notify.me
      </a>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <DirectionProvider direction="ltr">
      <Outlet />
    </DirectionProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
