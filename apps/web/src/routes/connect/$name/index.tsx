import { useEffect, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BellRingIcon, CheckCircle2Icon, HomeIcon } from "lucide-react"

import { AppShell, ScreenHeader, SoftStatus } from "@/components/app-shell"
import { InstallNudge } from "@/components/install-nudge"
import { bindDevice } from "@/lib/session"
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
      setMessage("You’re connected. Pushes will land here.")
    } catch (error) {
      setStep("error")
      setMessage(error instanceof Error ? error.message : "Something went wrong.")
    }
  }

  if (channelOk === false) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col justify-center gap-5 py-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            Link expired
          </h1>
          <p className="max-w-[20rem] text-[15px] leading-relaxed text-muted-foreground">
            Scan the QR from your dashboard again, or open your name from the
            homepage.
          </p>
          <Button
            nativeButton={false}
            size="lg"
            className="mt-4 h-13"
            render={<Link to="/" />}
          >
            <HomeIcon data-icon="inline-start" />
            Back to notify.me
          </Button>
        </div>
      </AppShell>
    )
  }

  const notificationsReady = permission === "granted" && connected
  const phase: "install" | "notify" | "done" = notificationsReady
    ? "done"
    : isStandalone
      ? "notify"
      : "install"

  return (
    <AppShell
      header={
        <ScreenHeader
          trailing={
            <SoftStatus tone={connected ? "ready" : "idle"}>
              {connected ? "Connected" : "Setup"}
            </SoftStatus>
          }
        />
      }
    >
      <main className="flex flex-1 flex-col">
        <section className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">Phone setup</p>
          <h1 className="mt-1 font-heading text-4xl font-medium tracking-tight">
            {name}
          </h1>
          <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-muted-foreground">
            {phase === "install"
              ? "Add this page to your home screen first."
              : phase === "notify"
                ? "Allow notifications so pushes can arrive."
                : "All set. Keep this app for quiet little pings."}
          </p>
        </section>

        <section className="mt-auto flex flex-col gap-4 pb-2 pt-12 animate-in fade-in slide-in-from-bottom-3 duration-600 delay-75">
          {phase === "install" ? <InstallNudge name={name} /> : null}

          {phase === "notify" ? (
            <Button
              type="button"
              size="lg"
              className="h-14 w-full"
              onClick={() => void enableNotifications()}
              disabled={step === "working"}
            >
              <BellRingIcon data-icon="inline-start" />
              {step === "working" ? "Enabling…" : "Enable notifications"}
            </Button>
          ) : null}

          {phase === "done" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2Icon className="size-5" />
                <p className="text-sm font-medium">Connected to {name}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-13 w-full"
                onClick={() => void enableNotifications()}
                disabled={step === "working"}
              >
                {step === "working" ? "Reconnecting…" : "Reconnect"}
              </Button>
            </div>
          ) : null}

          {message ? (
            <p
              className={
                step === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
              role="status"
            >
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </AppShell>
  )
}
