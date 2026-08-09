import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  BellIcon,
  CheckCircle2Icon,
  HomeIcon,
  ShareIcon,
} from "lucide-react"

import { bindDevice } from "@/lib/session"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/connect/$name")({
  component: ConnectPage,
  head: ({ params }) => ({
    meta: [
      { title: `Connect · ${params.name} · notify.me` },
      {
        name: "apple-mobile-web-app-title",
        content: `notify.me/${params.name}`,
      },
    ],
    links: [
      {
        rel: "manifest",
        href: `/manifest.webmanifest?name=${encodeURIComponent(params.name)}`,
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

function getInstallHint(name: string) {
  if (typeof navigator === "undefined") {
    return {
      platform: "unknown" as const,
      title: "Add to Home Screen",
      steps: [
        "Stay on this connect page",
        "Use Share / menu → Add to Home Screen",
        `Confirm the URL is …/connect/${name}, then open the icon and enable notifications`,
      ],
    }
  }

  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)

  if (isIOS) {
    return {
      platform: "ios" as const,
      title: "Add to Home Screen (iPhone)",
      steps: [
        "Stay on this page (do not go to the homepage)",
        "Tap Share → Add to Home Screen",
        `Check the URL shows /connect/${name}, then Add`,
        "Open the icon and enable notifications below",
      ],
    }
  }

  if (isAndroid) {
    return {
      platform: "android" as const,
      title: "Install app (Android)",
      steps: [
        "Stay on this connect page",
        "Tap the browser menu (⋮) → Install app / Add to Home screen",
        "Open the installed app, then enable notifications",
      ],
    }
  }

  return {
    platform: "desktop" as const,
    title: "Open on your phone",
    steps: [
      "Scan the QR from your dashboard on a phone",
      `Add /connect/${name} to your home screen from that page`,
      "Enable notifications from the installed app",
    ],
  }
}

function ConnectPage() {
  const { name } = Route.useParams()
  const [channelOk, setChannelOk] = useState<boolean | null>(null)
  const [connected, setConnected] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  )
  const [step, setStep] = useState<StepState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>
  } | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  const hint = useMemo(() => getInstallHint(name), [name])

  useEffect(() => {
    bindDevice(name)
  }, [name])

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)")
    const navStandalone =
      "standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setIsStandalone(media.matches || navStandalone)

    function onChange() {
      setIsStandalone(media.matches || navStandalone)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault()
      const promptEvent = event as Event & {
        prompt: () => Promise<void>
      }
      setDeferredPrompt(promptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/channel/${name}`)
      .then(async (response) => {
        if (!response.ok) {
          if (!cancelled) setChannelOk(false)
          return
        }
        const data = (await response.json()) as { connected: boolean }
        if (!cancelled) {
          setChannelOk(true)
          setConnected(data.connected)
        }
      })
      .catch(() => {
        if (!cancelled) setChannelOk(false)
      })
    return () => {
      cancelled = true
    }
  }, [name])

  async function enableNotifications() {
    setStep("working")
    setMessage(null)

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error(
          "Push notifications are not supported in this browser. Try Chrome or Safari on a phone."
        )
      }

      if (!window.isSecureContext) {
        throw new Error(
          "Notifications require HTTPS (or localhost). Open this page over a secure origin."
        )
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
      if (!vapid.publicKey) {
        throw new Error("Could not load VAPID public key.")
      }

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
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!saveResponse.ok) {
        const data = (await saveResponse.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to save subscription.")
      }

      bindDevice(name)
      setConnected(true)
      setStep("done")
      setMessage("You're connected. Notifications will appear on this device.")
    } catch (error) {
      setStep("error")
      setMessage(error instanceof Error ? error.message : "Something went wrong.")
    }
  }

  if (channelOk === false) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Unknown name
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span> is not
          claimed on this server yet.
        </p>
        <Button nativeButton={false} render={<Link to="/" />}>
          Claim a name
        </Button>
      </main>
    )
  }

  return (
    <div className="relative min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.93_0.05_170),_transparent_50%),linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.96_0.02_200))]"
      />

      <main className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-heading text-lg font-semibold tracking-tight">
            notify.me
          </Link>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Connected" : "Setup"}
          </Badge>
        </div>

        <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">Connecting</p>
          <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight">
            {name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Add <span className="font-medium text-foreground">this</span> page
            to your home screen (not the homepage), then enable notifications.
          </p>
        </div>

        <ol className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
          <li className="border border-foreground/10 bg-background/70 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <HomeIcon className="size-4 text-primary" />
              <h2 className="font-heading text-sm font-medium">{hint.title}</h2>
              {isStandalone ? (
                <CheckCircle2Icon className="ms-auto size-4 text-primary" />
              ) : null}
            </div>
            <ol className="mt-3 list-decimal space-y-1.5 ps-4 text-sm text-muted-foreground">
              {hint.steps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Expected URL:{" "}
              <code className="text-foreground">/connect/{name}</code>
            </p>
            {deferredPrompt ? (
              <Button
                type="button"
                className="mt-4 w-full"
                variant="outline"
                onClick={() => void deferredPrompt.prompt()}
              >
                <ShareIcon data-icon="inline-start" />
                Install notify.me
              </Button>
            ) : null}
          </li>

          <li className="border border-foreground/10 bg-background/70 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <BellIcon className="size-4 text-primary" />
              <h2 className="font-heading text-sm font-medium">
                Enable notifications
              </h2>
              {permission === "granted" && connected ? (
                <CheckCircle2Icon className="ms-auto size-4 text-primary" />
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Allow alerts so POST requests to your notify endpoint can wake this
              device.
            </p>
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={() => void enableNotifications()}
              disabled={step === "working"}
            >
              {step === "working"
                ? "Enabling…"
                : connected
                  ? "Reconnect notifications"
                  : "Enable notifications"}
            </Button>
          </li>
        </ol>

        {message ? (
          <Alert
            className="mt-6"
            variant={step === "error" ? "destructive" : "default"}
          >
            <AlertTitle>
              {step === "error" ? "Could not connect" : "Ready"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          To manage the API later, open notify.me and use{" "}
          <span className="text-foreground">Open existing</span> with your API
          key.
        </p>
      </main>
    </div>
  )
}
