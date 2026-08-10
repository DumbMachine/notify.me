import { useEffect, useState, type ReactNode } from "react"
import { DownloadIcon, ShareIcon, SquarePlusIcon } from "lucide-react"

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

function Step({
  n,
  children,
}: {
  n: number
  children: ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {n}
      </span>
      <p className="text-[15px] leading-relaxed">{children}</p>
    </li>
  )
}

export function InstallNudge({
  name,
  className,
}: {
  name: string
  className?: string
}) {
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
    setShowGuide(true)
  }

  const label =
    platform === "ios"
      ? "Add to Home Screen"
      : deferredPrompt
        ? "Install app"
        : "How to install"

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <Button
          type="button"
          size="lg"
          className="h-12 w-full"
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          {platform === "ios"
            ? "Opens a short guide — Safari can’t install with one tap."
            : "Adds this connect page to your home screen."}
        </p>
      </div>

      <BottomSheet open={showGuide} onOpenChange={setShowGuide}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>
              {platform === "ios" ? "Add to Home Screen" : "Install"}
            </BottomSheetTitle>
            <BottomSheetDescription>
              Stay on this page so it opens{" "}
              <span className="text-foreground">/connect/{name}</span>.
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetBody>
            <ol className="space-y-4">
              {platform === "ios" ? (
                <>
                  <Step n={1}>
                    Tap{" "}
                    <ShareIcon className="inline size-3.5 align-text-top" />{" "}
                    <span className="font-medium">Share</span> in Safari.
                  </Step>
                  <Step n={2}>
                    Choose{" "}
                    <SquarePlusIcon className="inline size-3.5 align-text-top" />{" "}
                    <span className="font-medium">Add to Home Screen</span>.
                  </Step>
                  <Step n={3}>
                    Tap <span className="font-medium">Add</span>, open the icon,
                    then enable notifications.
                  </Step>
                </>
              ) : (
                <>
                  <Step n={1}>
                    Open the browser menu{" "}
                    <span className="font-medium">(⋮)</span>.
                  </Step>
                  <Step n={2}>
                    Tap <span className="font-medium">Install app</span> or{" "}
                    <span className="font-medium">Add to Home screen</span>.
                  </Step>
                  <Step n={3}>Open it, then enable notifications.</Step>
                </>
              )}
            </ol>

            {platform === "ios" ? (
              <div className="pointer-events-none mt-2 flex justify-center text-primary">
                <div className="animate-bounce text-center">
                  <ShareIcon className="mx-auto size-5" />
                  <p className="mt-1 text-[10px] tracking-[0.14em] uppercase">
                    Share below
                  </p>
                </div>
              </div>
            ) : null}
          </BottomSheetBody>
          <BottomSheetFooter>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="h-12 w-full"
              onClick={() => setShowGuide(false)}
            >
              Got it
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
