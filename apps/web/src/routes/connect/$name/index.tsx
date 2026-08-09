import { useEffect, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckCircle2Icon } from "lucide-react"

import { InstallNudge } from "@/components/install-nudge"
import { bindDevice } from "@/lib/session"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/connect/$name/")({
  component: ConnectPage,
  validateSearch: (search: Record<string, unknown>): { k?: string } => ({
    k: typeof search.k === "string" ? search.k : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Connect · ${params.name} · notify.me` },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-title",
        content: `notify.me/${params.name}`,
      },
    ],
    links: [
      {
        rel: "manifest",
        href: `/connect/${encodeURIComponent(params.name)}/manifest.webmanifest`,
      },
    ],
  }),
})

type StepState = "idle" | "working" | "done" | "error"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function isStandaloneApp() {
  if (typeof window === "undefined") return false
  const media = window.matchMedia("(display-mode: standalone)").matches
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

function ConnectPage() {
  const { name } = Route.useParams()
  const { k: apiKey } = Route.useSearch()
  const [channelOk, setChannelOk] = useState<boolean | null>(null)
  const [connected, setConnected] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  )
  const [step, setStep] = useState<StepState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    bindDevice(name)
  }, [name])

  useEffect(() => {
    setIsStandalone(isStandaloneApp())
    const media = window.matchMedia("(display-mode: standalone)")
    function onChange() {
      setIsStandalone(isStandaloneApp())
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        if (apiKey) {
          const ensureResponse = await fetch(`/api/channel/${name}/ensure`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ apiKey }),
          })
          if (!ensureResponse.ok) {
            if (!cancelled) setChannelOk(false)
            return
          }
          const ensured = (await ensureResponse.json()) as { connected: boolean }
          if (!cancelled) {
            setChannelOk(true)
            setConnected(ensured.connected)
          }
          return
        }

        const response = await fetch(`/api/channel/${name}`)
        if (!response.ok) {
          if (!cancelled) setChannelOk(false)
          return
        }
        const data = (await response.json()) as { connected: boolean }
        if (!cancelled) {
          setChannelOk(true)
          setConnected(data.connected)
        }
      } catch {
        if (!cancelled) setChannelOk(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [name, apiKey])

  async function enableNotifications() {
    setStep("working")
    setMessage(null)

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push isn’t supported in this browser.")
      }
      if (!window.isSecureContext) {
        throw new Error("Notifications need HTTPS (or localhost).")
      }

      if (apiKey) {
        const ensureResponse = await fetch(`/api/channel/${name}/ensure`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ apiKey }),
        })
        if (!ensureResponse.ok) {
          const data = (await ensureResponse.json()) as { error?: string }
          throw new Error(data.error ?? "Could not open this channel.")
        }
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })
      await navigator.serviceWorker.ready

      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      if (permissionResult !== "granted") {
        throw new Error("Notification permission was not granted.")
      }

      const vapidResponse = await fetch("/api/vapid-public-key")
      const vapid = (await vapidResponse.json()) as { publicKey?: string }
      if (!vapid.publicKey) throw new Error("Could not load VAPID public key.")

      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
        }))

      const saveResponse = await fetch(`/api/channel/${name}/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey,
          subscription: subscription.toJSON(),
        }),
      })

      if (!saveResponse.ok) {
        const data = (await saveResponse.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to save subscription.")
      }

      bindDevice(name)
      setConnected(true)
      setStep("done")
      setMessage("Connected. Your dashboard should update in a moment.")
    } catch (error) {
      setStep("error")
      setMessage(error instanceof Error ? error.message : "Something went wrong.")
    }
  }

  if (channelOk === false) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Link expired
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Open the QR from your dashboard again, or use{" "}
          <span className="text-foreground">Open existing</span> on the homepage.
        </p>
        <Button nativeButton={false} className="h-12" render={<Link to="/" />}>
          Back to notify.me
        </Button>
      </main>
    )
  }

  const notificationsReady = permission === "granted" && connected

  return (
    <div className="relative min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.93_0.05_170),_transparent_50%),linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.96_0.02_200))]"
      />

      <main className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between py-4">
          <Link to="/" className="font-heading text-lg font-semibold tracking-tight">
            notify.me
          </Link>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Connected" : "Setup"}
          </Badge>
        </header>

        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">Phone setup</p>
          <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight">
            {name}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Two steps. Install this page, then allow notifications.
          </p>
        </div>

        <ol className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-75">
          <li>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                1
              </span>
              <h2 className="font-heading text-base font-medium">Install</h2>
              {isStandalone ? (
                <CheckCircle2Icon className="ms-auto size-4 text-primary" />
              ) : null}
            </div>
            {isStandalone ? (
              <p className="text-sm text-muted-foreground">
                Installed. Continue below.
              </p>
            ) : (
              <InstallNudge name={name} />
            )}
          </li>

          <li>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                2
              </span>
              <h2 className="font-heading text-base font-medium">Notifications</h2>
              {notificationsReady ? (
                <CheckCircle2Icon className="ms-auto size-4 text-primary" />
              ) : null}
            </div>
            <Button
              type="button"
              className="h-12 w-full"
              onClick={() => void enableNotifications()}
              disabled={step === "working"}
              variant={notificationsReady ? "outline" : "default"}
            >
              {step === "working"
                ? "Enabling…"
                : notificationsReady
                  ? "Reconnect"
                  : "Enable notifications"}
            </Button>
          </li>
        </ol>

        {message ? (
          <p
            className={
              step === "error"
                ? "mt-6 text-sm text-destructive"
                : "mt-6 text-sm text-muted-foreground"
            }
            role="status"
          >
            {message}
          </p>
        ) : null}

        <p className="mt-auto pt-12 text-center text-xs text-muted-foreground">
          Manage the API later with{" "}
          <span className="text-foreground">Open existing</span>.
        </p>
      </main>
    </div>
  )
}
