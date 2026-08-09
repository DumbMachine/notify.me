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
import { Label } from "@workspace/ui/components/label"

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

    // Home-screen apps that landed on `/` should bounce back to the bound phone page.
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
    <div className="relative min-h-svh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.04_170)_0%,_transparent_55%),linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.97_0.02_200))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-10%] size-[28rem] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-20%] start-[-10%] size-[24rem] rounded-full bg-teal-500/10 blur-3xl"
      />

      <main className="relative mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-6 py-16">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both">
          <p className="font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            notify.me
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Claim a name, connect your phone, and send yourself push
            notifications with one API call.
          </p>
        </div>

        {deviceName ? (
          <div className="mt-8 max-w-md animate-in fade-in duration-500">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between px-3"
              onClick={() =>
                void navigate({
                  to: "/connect/$name",
                  params: { name: deviceName },
                })
              }
            >
              <span className="text-muted-foreground">This phone</span>
              <span className="font-medium">Open {deviceName}</span>
              <ArrowRightIcon />
            </Button>
          </div>
        ) : null}

        <div className="mt-8 flex max-w-md gap-4 text-sm animate-in fade-in duration-500">
          <button
            type="button"
            className={
              mode === "claim"
                ? "font-medium text-foreground underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }
            onClick={() => {
              setMode("claim")
              setError(null)
            }}
          >
            Claim a name
          </button>
          <button
            type="button"
            className={
              mode === "login"
                ? "font-medium text-foreground underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }
            onClick={() => {
              setMode("login")
              setError(null)
            }}
          >
            Open existing
          </button>
        </div>

        {mode === "claim" ? (
          <form
            onSubmit={onClaim}
            className="mt-4 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both"
          >
            <Label htmlFor="name" className="text-xs text-muted-foreground">
              Your name
            </Label>
            <div className="mt-2 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-xs text-muted-foreground">
                  notify.me/
                </span>
                <Input
                  id="name"
                  name="name"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="alex"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className="h-11 pe-3 ps-[5.5rem] text-sm"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-11 px-4"
                disabled={pending || name.trim().length < 3}
              >
                {pending ? "Claiming…" : "Claim"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                In-memory for now — names reset when the server restarts.
              </p>
            )}
          </form>
        ) : (
          <form
            onSubmit={onLogin}
            className="mt-4 max-w-md space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both"
          >
            <div>
              <Label htmlFor="login-name" className="text-xs text-muted-foreground">
                Name
              </Label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-xs text-muted-foreground">
                  notify.me/
                </span>
                <Input
                  id="login-name"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className="h-11 pe-3 ps-[5.5rem] text-sm"
                  required
                  minLength={3}
                  maxLength={32}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="api-key" className="text-xs text-muted-foreground">
                API key
              </Label>
              <Input
                id="api-key"
                type="password"
                autoComplete="current-password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
                className="mt-2 h-11 text-sm"
                required
                minLength={16}
                placeholder="Paste the key from your dashboard"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full"
              disabled={pending || name.trim().length < 3 || apiKey.length < 16}
            >
              {pending ? "Opening…" : "Open dashboard"}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use this if you closed the browser or need the QR / API details
                again.
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  )
}
