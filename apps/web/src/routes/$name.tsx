import { useEffect, useMemo, useState, type FormEvent } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BellRingIcon, SmartphoneIcon } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import { QrCode } from "@/components/qr-code"
import { loadCreds, saveCreds, type StoredCreds } from "@/lib/session"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"

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
      const creds = {
        apiKey: data.apiKey,
        notifyUrl: data.notifyUrl,
        connectUrl: data.connectUrl,
      }
      saveCreds(name, creds)
      onRestored(creds)
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-foreground/10 p-4">
      <p className="text-sm text-muted-foreground">
        Enter the API key for <span className="font-medium text-foreground">{name}</span>{" "}
        to restore this dashboard.
      </p>
      <Input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value.trim())}
        placeholder="API key"
        className="h-9"
        required
        minLength={16}
      />
      <Button type="submit" disabled={pending || apiKey.length < 16}>
        {pending ? "Opening…" : "Unlock dashboard"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
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
    const id = window.setInterval(() => void refresh(), 3000)
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
      setTestResult("API key missing from this browser session. Claim the name again.")
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
      if (!response.ok) {
        setTestResult(data.error ?? "Failed to send.")
      } else {
        setTestResult("Sent. Check your phone.")
      }
    } catch {
      setTestResult("Network error while sending.")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="relative min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.97_0.015_200))]"
      />

      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/"
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          notify.me
        </Link>
        <Badge variant={status?.connected ? "default" : "secondary"}>
          {status?.connected ? "Phone connected" : "Waiting for phone"}
        </Badge>
      </header>

      <main className="relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">Your endpoint</p>
          <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {name}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Scan the QR on your phone and add{" "}
            <span className="font-medium text-foreground">/connect/{name}</span>{" "}
            to the home screen (not the homepage), then allow notifications.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notify URL
                </p>
                <CopyButton value={notifyUrl} />
              </div>
              <code className="block overflow-x-auto bg-foreground/5 px-3 py-2 text-xs">
                {notifyUrl}
              </code>
            </div>

            {creds ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    API key
                  </p>
                  <CopyButton value={creds.apiKey} />
                </div>
                <code className="block overflow-x-auto bg-foreground/5 px-3 py-2 text-xs">
                  {creds.apiKey}
                </code>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saved on this device. Use{" "}
                  <Link to="/" className="underline-offset-4 hover:underline">
                    Open existing
                  </Link>{" "}
                  with this key if you switch browsers.
                </p>
              </div>
            ) : (
              <DashboardLogin name={name} onRestored={setCreds} />
            )}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Example
                </p>
                <CopyButton value={curlExample} label="Copy curl" />
              </div>
              <pre className="overflow-x-auto bg-foreground/5 px-3 py-3 text-xs leading-relaxed">
                {curlExample}
              </pre>
            </div>
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
          <div className="border border-foreground/10 bg-background/80 p-6 backdrop-blur">
            <div className="flex items-start gap-3">
              <SmartphoneIcon className="mt-0.5 size-5 text-primary" />
              <div>
                <h2 className="font-heading text-lg font-medium">Connect phone</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open this link on your phone, then add to Home Screen.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <QrCode value={connectUrl} size={200} />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate bg-foreground/5 px-2 py-1.5 text-xs">
                {connectUrl}
              </code>
              <CopyButton value={connectUrl} label="Copy link" />
            </div>

            <Separator className="my-6" />

            <div className="flex items-start gap-3">
              <BellRingIcon className="mt-0.5 size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-medium">Send a test</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once your phone is connected, try a notification from here.
                </p>
                <div className="mt-4 space-y-2">
                  <input
                    className="h-9 w-full border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <Textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder="Body"
                    rows={3}
                  />
                  <Button
                    type="button"
                    onClick={() => void sendTest()}
                    disabled={testing || !testTitle.trim()}
                    className="w-full"
                  >
                    {testing ? "Sending…" : "Send test notification"}
                  </Button>
                  {testResult ? (
                    <p className="text-sm text-muted-foreground" role="status">
                      {testResult}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
