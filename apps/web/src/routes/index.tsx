import { useEffect, useState, type FormEvent } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowRightIcon, KeyRoundIcon, SparklesIcon } from "lucide-react"

import { AppShell, BrandMark } from "@/components/app-shell"
import {
  getBoundDevice,
  getLastName,
  saveCreds,
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
import { Input } from "@workspace/ui/components/input"

export const Route = createFileRoute("/")({ component: HomePage })

type SessionResponse = {
  name: string
  apiKey: string
  notifyUrl: string
  connectUrl: string
  dashboardUrl: string
  connected: boolean
  error?: string
}

type SheetMode = "claim" | "login" | null

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false
  const media = window.matchMedia("(display-mode: standalone)").matches
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

function NameField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-sm text-muted-foreground">
        notify.me/
      </span>
      <Input
        id={id}
        name="name"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="alex"
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="h-13 border-border/80 bg-background/80 pe-4 ps-[5.9rem] text-base"
        required
        minLength={3}
        maxLength={32}
        pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
      />
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)

  useEffect(() => {
    const bound = getBoundDevice()
    setDeviceName(bound)
    const last = getLastName()
    if (last) setName((current) => current || last)

    if (bound && isStandaloneDisplay()) {
      void navigate({
        to: "/connect/$name",
        params: { name: bound },
        replace: true,
      })
    }
  }, [navigate])

  function openSheet(mode: SheetMode) {
    setError(null)
    setSheet(mode)
  }

  async function persistAndGo(data: SessionResponse) {
    saveCreds(data.name, {
      apiKey: data.apiKey,
      notifyUrl: data.notifyUrl,
      connectUrl: data.connectUrl,
    })
    setSheet(null)
    await navigate({ to: "/$name", params: { name: data.name } })
  }

  async function onClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = (await response.json()) as SessionResponse
      if (!response.ok) {
        setError(data.error ?? "Could not claim that name.")
        return
      }
      await persistAndGo(data)
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setPending(false)
    }
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, apiKey }),
      })
      const data = (await response.json()) as SessionResponse
      if (!response.ok) {
        setError(data.error ?? "Could not open that name.")
        return
      }
      await persistAndGo(data)
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col">
        <div className="pt-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <BrandMark size="hero" className="block" />
          <p className="mt-5 max-w-[18rem] text-[17px] leading-relaxed text-muted-foreground">
            A quiet little name for your phone. Claim it, connect once, notify
            forever.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-16 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {deviceName ? (
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/connect/$name",
                  params: { name: deviceName },
                })
              }
              className="flex h-13 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 text-start shadow-[0_12px_40px_-28px_rgba(36,58,46,0.45)] backdrop-blur-sm transition-colors hover:bg-card"
            >
              <span className="text-sm text-muted-foreground">Continue as</span>
              <span className="flex items-center gap-2 font-medium">
                {deviceName}
                <ArrowRightIcon className="size-4 opacity-60" />
              </span>
            </button>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="h-14 w-full text-[15px]"
            onClick={() => openSheet("claim")}
          >
            <SparklesIcon data-icon="inline-start" />
            Claim a name
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-12 w-full text-muted-foreground"
            onClick={() => openSheet("login")}
          >
            <KeyRoundIcon data-icon="inline-start" />
            I already have one
          </Button>
        </div>
      </div>

      <BottomSheet
        open={sheet === "claim"}
        onOpenChange={(open) => {
          if (!open) setSheet(null)
        }}
      >
        <BottomSheetContent>
          <form onSubmit={onClaim}>
            <BottomSheetHeader>
              <BottomSheetTitle>Claim your name</BottomSheetTitle>
              <BottomSheetDescription>
                Pick something short and yours. This becomes your notify URL.
              </BottomSheetDescription>
            </BottomSheetHeader>
            <BottomSheetBody>
              <NameField id="claim-name" value={name} onChange={setName} />
              {error && sheet === "claim" ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Demo storage may reset — keep your API key nearby.
                </p>
              )}
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button
                type="submit"
                size="lg"
                className="h-13 w-full"
                disabled={pending || name.trim().length < 3}
              >
                {pending ? "Claiming…" : "Continue"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </BottomSheetFooter>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet
        open={sheet === "login"}
        onOpenChange={(open) => {
          if (!open) setSheet(null)
        }}
      >
        <BottomSheetContent>
          <form onSubmit={onLogin}>
            <BottomSheetHeader>
              <BottomSheetTitle>Welcome back</BottomSheetTitle>
              <BottomSheetDescription>
                Open your dashboard with your name and API key.
              </BottomSheetDescription>
            </BottomSheetHeader>
            <BottomSheetBody>
              <NameField id="login-name" value={name} onChange={setName} />
              <Input
                id="api-key"
                type="password"
                autoComplete="current-password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
                className="h-13 border-border/80 bg-background/80 text-base"
                required
                minLength={16}
                placeholder="API key"
              />
              {error && sheet === "login" ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button
                type="submit"
                size="lg"
                className="h-13 w-full"
                disabled={
                  pending || name.trim().length < 3 || apiKey.length < 16
                }
              >
                {pending ? "Opening…" : "Open dashboard"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </BottomSheetFooter>
          </form>
        </BottomSheetContent>
      </BottomSheet>
    </AppShell>
  )
}
