import { useEffect, useId, useState } from "react"
import { DownloadIcon, ShareIcon, SquarePlusIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "ios" | "android" | "other"

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return "ios"
  if (/Android/.test(ua)) return "android"
  return "other"
}

function isStandaloneApp() {
  if (typeof window === "undefined") return false
  const media = window.matchMedia("(display-mode: standalone)").matches
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

export function InstallNudge({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const titleId = useId()
  const [platform] = useState<Platform>(() => detectPlatform())
  const [standalone, setStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    setStandalone(isStandaloneApp())
    const media = window.matchMedia("(display-mode: standalone)")
    function onChange() {
      setStandalone(isStandaloneApp())
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  if (standalone) return null

  async function onInstallClick() {
    if (deferredPrompt) {
      setInstalling(true)
      try {
        await deferredPrompt.prompt()
        await deferredPrompt.userChoice
        setDeferredPrompt(null)
      } finally {
        setInstalling(false)
      }
      return
    }

    // iOS (and browsers without a native install prompt) get a guided nudge.
    setShowGuide(true)
  }

  const label =
    platform === "ios"
      ? "Add to Home Screen"
      : deferredPrompt
        ? "Install notify.me"
        : "Install app"

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <Button
          type="button"
          className="h-11 w-full"
          onClick={() => void onInstallClick()}
          disabled={installing}
        >
          {platform === "ios" ? (
            <ShareIcon data-icon="inline-start" />
          ) : (
            <DownloadIcon data-icon="inline-start" />
          )}
          {installing ? "Opening…" : label}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {platform === "ios"
            ? "Safari can’t install automatically — this shows the one-tap path."
            : deferredPrompt
              ? "Installs this connect page as an app on your phone."
              : "We’ll walk you through adding this page to your home screen."}
        </p>
      </div>

      {showGuide ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close install guide"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setShowGuide(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 border border-foreground/10 bg-background p-5 shadow-lg duration-300 sm:rounded-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="font-heading text-lg font-medium">
                  {platform === "ios" ? "Add to Home Screen" : "Install notify.me"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep this page open so the app opens{" "}
                  <code className="text-foreground">/connect/{name}</code>.
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowGuide(false)}
              >
                <XIcon />
              </Button>
            </div>

            {platform === "ios" ? (
              <ol className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                    1
                  </span>
                  <p>
                    Tap the <ShareIcon className="inline size-3.5 align-text-top" />{" "}
                    <span className="font-medium">Share</span> button in Safari
                    (bottom center).
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                    2
                  </span>
                  <p>
                    Scroll and tap{" "}
                    <SquarePlusIcon className="inline size-3.5 align-text-top" />{" "}
                    <span className="font-medium">Add to Home Screen</span>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                    3
                  </span>
                  <p>
                    Confirm the name looks right, then tap{" "}
                    <span className="font-medium">Add</span>. Open the icon and
                    enable notifications.
                  </p>
                </li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                    1
                  </span>
                  <p>
                    Tap the browser menu{" "}
                    <span className="font-medium">(⋮)</span>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                    2
                  </span>
                  <p>
                    Choose{" "}
                    <span className="font-medium">Install app</span> or{" "}
                    <span className="font-medium">Add to Home screen</span>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-xs font-medium text-primary">
                    3
                  </span>
                  <p>Open the installed app, then enable notifications.</p>
                </li>
              </ol>
            )}

            {platform === "ios" ? (
              <div className="pointer-events-none mt-6 flex justify-center">
                <div className="animate-bounce text-primary">
                  <ShareIcon className="size-6" />
                  <p className="mt-1 text-[10px] tracking-wide uppercase">
                    Share is below
                  </p>
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              className="mt-6 w-full"
              variant="outline"
              onClick={() => setShowGuide(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
