import { useEffect, useMemo, useState, type FormEvent } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronDownIcon } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import { QrCode } from "@/components/qr-code"
import { loadCreds, saveCreds, type StoredCreds } from "@/lib/session"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/$name")({
  component: DashboardPage,
})

type ChannelStatus = {
  name: string
  connected: boolean
  createdAt: number
  error?: string
}

function DashboardLogin({
  name,
  onRestored,
}: {
  name: string
  onRestored: (creds: StoredCreds) => void
}) {
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, apiKey }),
      })
      const data = (await response.json()) as StoredCreds & { error?: string }
      if (!response.ok) {
        setError(data.error ?? "Could not restore this name.")
        return
      }
      const next = {
        apiKey: data.apiKey,
        notifyUrl: data.notifyUrl,
        connectUrl: data.connectUrl,
      }
      saveCreds(name, next)
      onRestored(next)
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enter the API key for <span className="font-medium text-foreground">{name}</span>.
      </p>
      <Input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value.trim())}
        placeholder="API key"
        className="h-12 border-foreground/15 text-base md:text-sm"
        required
        minLength={16}
      />
      <Button
        type="submit"
        className="h-12 w-full"
        disabled={pending || apiKey.length < 16}
      >
        {pending ? "Opening…" : "Unlock"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function FieldRow({
  label,
  value,
  mono = true,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <CopyButton value={value} />
      </div>
      <p
        className={cn(
          "break-all bg-foreground/5 px-3 py-2.5 text-sm leading-relaxed",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function DashboardPage() {
  const { name } = Route.useParams()
  const [creds, setCreds] = useState<StoredCreds | null>(null)
  const [status, setStatus] = useState<ChannelStatus | null>(null)
  const [testTitle, setTestTitle] = useState("Hello from notify.me")
  const [testBody, setTestBody] = useState("Your phone is connected.")
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [showApi, setShowApi] = useState(false)

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

  const connectUrl = useMemo(
    () => creds?.connectUrl ?? `${origin}/connect/${name}`,
    [creds, origin, name]
  )
  const notifyUrl = useMemo(
    () => creds?.notifyUrl ?? `${origin}/api/notify/${name}`,
    [creds, origin, name]
  )

  useEffect(() => {
    setCreds(loadCreds(name))
  }, [name])

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const response = await fetch(`/api/channel/${name}`)
        const data = (await response.json()) as ChannelStatus
        if (!cancelled) {
          if (response.ok) setStatus(data)
          else setStatus(null)
        }
      } catch {
        if (!cancelled) setStatus(null)
      }
    }

    void refresh()
    const id = window.setInterval(() => void refresh(), 1500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [name])

  const curlExample = creds
    ? `curl -X POST '${notifyUrl}' \\\n  -H 'Authorization: Bearer ${creds.apiKey}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"title":"Hello","body":"From your API"}'`
    : `curl -X POST '${notifyUrl}' \\\n  -H 'Authorization: Bearer YOUR_API_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"title":"Hello","body":"From your API"}'`

  async function sendTest() {
    if (!creds) {
      setTestResult("Unlock this dashboard with your API key first.")
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch(notifyUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: testTitle, body: testBody }),
      })
      const data = (await response.json()) as { error?: string; ok?: boolean }
      setTestResult(
        response.ok ? "Sent. Check your phone." : (data.error ?? "Failed to send.")
      )
    } catch {
      setTestResult("Network error while sending.")
    } finally {
      setTesting(false)
    }
  }

  const connected = Boolean(status?.connected)

  return (
    <div className="relative min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.97_0.015_200))]"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-lg flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <header className="flex items-center justify-between gap-3 py-4">
          <Link
            to="/"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            notify.me
          </Link>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Connected" : "Waiting"}
          </Badge>
        </header>

        <main className="flex flex-1 flex-col gap-8 pb-8">
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-sm text-muted-foreground">Your endpoint</p>
            <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight">
              {name}
            </h1>
          </section>

          {!creds ? (
            <section className="animate-in fade-in duration-500">
              <DashboardLogin name={name} onRestored={setCreds} />
            </section>
          ) : (
            <>
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-base font-medium">
                      1. Connect phone
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Scan, install, then enable notifications.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col items-center gap-4">
                  <QrCode value={connectUrl} size={196} className="shadow-sm" />
                  <div className="flex w-full items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                      /connect/{name}
                    </p>
                    <CopyButton value={connectUrl} label="Copy link" />
                  </div>
                </div>
              </section>

              <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                <h2 className="font-heading text-base font-medium">2. Send a test</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {connected
                    ? "Your phone is ready."
                    : "Works after the phone is connected."}
                </p>
                <div className="mt-4 space-y-2.5">
                  <Input
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Title"
                    className="h-12 border-foreground/15 text-base md:text-sm"
                  />
                  <Textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder="Body"
                    rows={2}
                    className="min-h-20 border-foreground/15 text-base md:text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => void sendTest()}
                    disabled={testing || !testTitle.trim()}
                    className="h-12 w-full"
                  >
                    {testing ? "Sending…" : "Send test"}
                  </Button>
                  {testResult ? (
                    <p className="text-sm text-muted-foreground" role="status">
                      {testResult}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="animate-in fade-in duration-500 delay-150">
                <button
                  type="button"
                  onClick={() => setShowApi((value) => !value)}
                  className="flex w-full items-center justify-between py-2 text-start"
                >
                  <div>
                    <h2 className="font-heading text-base font-medium">API</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Endpoint, key, and curl
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      showApi && "rotate-180"
                    )}
                  />
                </button>

                {showApi ? (
                  <div className="mt-3 space-y-5 border-t border-foreground/10 pt-5">
                    <FieldRow label="Notify URL" value={notifyUrl} />
                    <FieldRow label="API key" value={creds.apiKey} />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Example
                        </p>
                        <CopyButton value={curlExample} label="Copy curl" />
                      </div>
                      <pre className="overflow-x-auto bg-foreground/5 px-3 py-3 font-mono text-[11px] leading-relaxed">
                        {curlExample}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
