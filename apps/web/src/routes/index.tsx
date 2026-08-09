import { useEffect, useState, type FormEvent } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import {
  getBoundDevice,
  getLastName,
  saveCreds,
} from "@/lib/session"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

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

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false
  const media = window.matchMedia("(display-mode: standalone)").matches
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

function HomePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"claim" | "login">("claim")
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
      void navigate({ to: "/connect/$name", params: { name: bound }, replace: true })
    }
  }, [navigate])

  async function persistAndGo(data: SessionResponse) {
    saveCreds(data.name, {
      apiKey: data.apiKey,
      notifyUrl: data.notifyUrl,
      connectUrl: data.connectUrl,
    })
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
    <div className="relative min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_oklch(0.93_0.05_170)_0%,_transparent_45%),linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.97_0.02_200))]"
      />

      <main className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:justify-center sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="font-heading text-[2.75rem] leading-none font-semibold tracking-tight sm:text-6xl">
            notify.me
          </h1>
          <p className="mt-4 max-w-[22rem] text-[15px] leading-relaxed text-muted-foreground">
            Claim a name. Connect your phone. Push to it with one API call.
          </p>
        </div>

        <div className="mt-10 flex flex-1 flex-col gap-5 sm:mt-12 sm:flex-none">
          {deviceName ? (
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/connect/$name",
                  params: { name: deviceName },
                })
              }
              className="flex h-12 items-center justify-between gap-3 border border-foreground/10 bg-background/70 px-4 text-start text-sm backdrop-blur transition-colors hover:bg-background"
            >
              <span className="text-muted-foreground">Continue as</span>
              <span className="flex items-center gap-2 font-medium">
                {deviceName}
                <ArrowRightIcon className="size-4" />
              </span>
            </button>
          ) : null}

          <div className="grid grid-cols-2 gap-1 bg-foreground/5 p-1">
            {(["claim", "login"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value)
                  setError(null)
                }}
                className={cn(
                  "h-10 text-sm transition-colors",
                  mode === value
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {value === "claim" ? "New name" : "Open existing"}
              </button>
            ))}
          </div>

          {mode === "claim" ? (
            <form onSubmit={onClaim} className="space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground">
                  notify.me/
                </span>
                <Input
                  id="name"
                  name="name"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="alex"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className="h-12 border-foreground/15 pe-3 ps-[5.75rem] text-base md:text-sm"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-sm"
                disabled={pending || name.trim().length < 3}
              >
                {pending ? "Claiming…" : "Claim name"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </form>
          ) : (
            <form onSubmit={onLogin} className="space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground">
                  notify.me/
                </span>
                <Input
                  id="login-name"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className="h-12 border-foreground/15 pe-3 ps-[5.75rem] text-base md:text-sm"
                  required
                  minLength={3}
                  maxLength={32}
                />
              </div>
              <Input
                id="api-key"
                type="password"
                autoComplete="current-password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
                className="h-12 border-foreground/15 text-base md:text-sm"
                required
                minLength={16}
                placeholder="API key"
              />
              <Button
                type="submit"
                className="h-12 w-full text-sm"
                disabled={pending || name.trim().length < 3 || apiKey.length < 16}
              >
                {pending ? "Opening…" : "Open dashboard"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </form>
          )}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {mode === "claim"
                ? "Names are temporary while storage is in-memory / demo-backed."
                : "Use your name and API key to get the QR and endpoint again."}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
