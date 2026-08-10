import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BellRingIcon, HomeIcon, Settings2Icon } from "lucide-react"

import { InstallNudge } from "@/components/install-nudge"
import {
  LockScreen,
  type LockNotification,
} from "@/components/lock-screen"
import {
  bindDevice,
  buildConnectManifestUrl,
  resolveDeviceApiKey,
  saveDeviceChannel,
} from "@/lib/session"
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/connect/$name/")({
  component: ConnectPage,
  validateSearch: (
    search: Record<string, unknown>
  ): { k?: string; n?: string } => ({
    k: typeof search.k === "string" ? search.k : undefined,
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} · notify.me` },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#000000" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
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

function mergeNotifications(
  current: LockNotification[],
  incoming: LockNotification[]
) {
  const map = new Map<string, LockNotification>()
  for (const item of [...incoming, ...current]) {
    if (!item?.id) continue
    const existing = map.get(item.id)
    if (!existing || item.createdAt >= existing.createdAt) {
      map.set(item.id, item)
    }
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt)
}

function ConnectPage() {
  const { name } = Route.useParams()
  const { k: urlKey, n: focusId } = Route.useSearch()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [keyReady, setKeyReady] = useState(false)
  const [channelOk, setChannelOk] = useState<boolean | null>(null)
  const [connected, setConnected] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  )
  const [step, setStep] = useState<StepState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [notifications, setNotifications] = useState<LockNotification[]>([])

  useEffect(() => {
    bindDevice(name)
    const resolved = resolveDeviceApiKey(name, urlKey)
    setApiKey(resolved)
    setKeyReady(true)
    if (resolved) {
      // Persist for Home Screen launches (manifest start_url drops ?k= unless we
      // inject a client manifest; cookie/localStorage cover return visits).
      saveDeviceChannel(name, { apiKey: resolved })
    }
  }, [name, urlKey])

  useEffect(() => {
    if (!apiKey) return

    const href = buildConnectManifestUrl(name, apiKey)
    const links = [
      ...document.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]'),
    ]
    const previousHrefs = links.map((link) => link.href)

    if (links.length === 0) {
      const link = document.createElement("link")
      link.rel = "manifest"
      link.href = href
      document.head.appendChild(link)
    } else {
      for (const link of links) {
        link.href = href
      }
    }

    return () => {
      URL.revokeObjectURL(href)
      for (const previous of previousHrefs) {
        if (previous.startsWith("blob:")) URL.revokeObjectURL(previous)
      }
    }
  }, [apiKey, name])

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

  useEffect(() => {
    if (!apiKey || channelOk === false) return

    let cancelled = false

    async function refresh() {
      try {
        const response = await fetch(
          `/api/channel/${encodeURIComponent(name)}/notifications`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        )
        if (!response.ok) return
        const data = (await response.json()) as {
          connected?: boolean
          notifications?: LockNotification[]
        }
        if (cancelled) return
        if (typeof data.connected === "boolean") setConnected(data.connected)
        if (Array.isArray(data.notifications)) {
          setNotifications((current) =>
            mergeNotifications(current, data.notifications ?? [])
          )
        }
      } catch {
        // keep current inbox
      }
    }

    void refresh()
    const id = window.setInterval(() => void refresh(), 2500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [apiKey, channelOk, name])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    function onMessage(event: MessageEvent) {
      const data = event.data as
        | { type?: string; notification?: LockNotification }
        | undefined
      if (data?.type !== "notify.me:push" || !data.notification) return
      setNotifications((current) =>
        mergeNotifications(current, [data.notification as LockNotification])
      )
    }

    navigator.serviceWorker.addEventListener("message", onMessage)
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage)
    }
  }, [])

  useEffect(() => {
    if (channelOk !== true || !apiKey) return
    if (isStandalone && !(permission === "granted" && connected)) {
      setSetupOpen(true)
    }
  }, [channelOk, apiKey, isStandalone, permission, connected])

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

      if (apiKey) saveDeviceChannel(name, { apiKey })
      bindDevice(name)
      setConnected(true)
      setStep("done")
      setMessage("Alerts enabled. New pings will appear here.")
      setSetupOpen(false)
    } catch (error) {
      setStep("error")
      setMessage(error instanceof Error ? error.message : "Something went wrong.")
    }
  }

  const notificationsReady = permission === "granted" && connected
  const setupPhase: "install" | "notify" | "done" = notificationsReady
    ? "done"
    : isStandalone
      ? "notify"
      : "install"

  const setupLabel = useMemo(() => {
    switch (setupPhase) {
      case "install":
        return "Add to Home Screen"
      case "notify":
        return "Enable alerts"
      case "done":
        return "Settings"
      default: {
        const _exhaustive: never = setupPhase
        return _exhaustive
      }
    }
  }, [setupPhase])

  if (channelOk === false) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-5 px-5 atmosphere">
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
          className="mt-4 h-12"
          render={<Link to="/" />}
        >
          <HomeIcon data-icon="inline-start" />
          Back to notify.me
        </Button>
      </main>
    )
  }

  if (!keyReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white/60">
        Opening lock screen…
      </div>
    )
  }

  if (!apiKey) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-5 px-5 atmosphere">
        <h1 className="font-heading text-4xl font-medium tracking-tight">
          Open from your QR
        </h1>
        <p className="max-w-[22rem] text-[15px] leading-relaxed text-muted-foreground">
          This lock screen needs the connect link from your dashboard so it can
          show your notification history. Scan the QR again, then add to Home
          Screen from that page.
        </p>
        <Button
          nativeButton={false}
          size="lg"
          className="mt-4 h-12"
          render={<Link to="/" />}
        >
          Back to notify.me
        </Button>
      </main>
    )
  }

  if (channelOk === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white/60">
        Opening lock screen…
      </div>
    )
  }

  return (
    <>
      <LockScreen
        name={name}
        notifications={notifications}
        focusId={focusId}
        footer={
          <div className="flex items-center justify-center gap-3 pb-1">
            <Button
              type="button"
              variant="secondary"
              className="h-10 bg-white/12 text-white hover:bg-white/18 hover:text-white"
              onClick={() => setSetupOpen(true)}
            >
              {setupPhase === "done" ? (
                <Settings2Icon data-icon="inline-start" />
              ) : (
                <BellRingIcon data-icon="inline-start" />
              )}
              {setupLabel}
            </Button>
          </div>
        }
      />

      <BottomSheet open={setupOpen} onOpenChange={setSetupOpen}>
        <BottomSheetContent className="bg-card text-card-foreground">
          <BottomSheetHeader>
            <BottomSheetTitle>
              {setupPhase === "done"
                ? "Connected"
                : setupPhase === "notify"
                  ? "Enable alerts"
                  : "Save this lock screen"}
            </BottomSheetTitle>
            <BottomSheetDescription>
              {setupPhase === "done"
                ? "Push is on. You can still browse history here anytime."
                : setupPhase === "notify"
                  ? "Allow notifications so new pings arrive instantly."
                  : "Install for the full app feel — or keep this tab open as a live inbox."}
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetBody>
            {setupPhase === "install" ? <InstallNudge name={name} /> : null}

            {setupPhase === "notify" ? (
              <Button
                type="button"
                size="lg"
                className="h-12 w-full"
                onClick={() => void enableNotifications()}
                disabled={step === "working"}
              >
                <BellRingIcon data-icon="inline-start" />
                {step === "working" ? "Enabling…" : "Enable notifications"}
              </Button>
            ) : null}

            {setupPhase === "done" ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-full"
                onClick={() => void enableNotifications()}
                disabled={step === "working"}
              >
                {step === "working" ? "Reconnecting…" : "Reconnect push"}
              </Button>
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
            ) : (
              <p className="text-sm text-muted-foreground">
                History stays on this screen even when Home Screen install isn’t
                available.
              </p>
            )}
          </BottomSheetBody>
          <BottomSheetFooter>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full"
              onClick={() => setSetupOpen(false)}
            >
              Back to lock screen
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
