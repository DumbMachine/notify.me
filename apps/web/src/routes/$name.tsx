import { useEffect, useMemo, useState, type FormEvent } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Code2Icon, SendIcon } from "lucide-react"

import { AppShell, ScreenHeader, SoftStatus } from "@/components/app-shell"
import { CopyButton } from "@/components/copy-button"
import { QrCode } from "@/components/qr-code"
import { loadCreds, saveCreds, type StoredCreds } from "@/lib/session"
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

type SheetMode = "test" | "api" | "unlock" | null

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
          "break-all rounded-2xl bg-muted/70 px-3.5 py-3 text-sm leading-relaxed",
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
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [unlockKey, setUnlockKey] = useState("")
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlockPending, setUnlockPending] = useState(false)

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
    const loaded = loadCreds(name)
    setCreds(loaded)
    if (!loaded) setSheet("unlock")
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

  async function onUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUnlockPending(true)
    setUnlockError(null)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, apiKey: unlockKey }),
      })
      const data = (await response.json()) as StoredCreds & { error?: string }
      if (!response.ok) {
        setUnlockError(data.error ?? "Could not restore this name.")
        return
      }
      const next = {
        apiKey: data.apiKey,
        notifyUrl: data.notifyUrl,
        connectUrl: data.connectUrl,
      }
      saveCreds(name, next)
      setCreds(next)
      setSheet(null)
    } catch {
      setUnlockError("Something went wrong. Try again.")
    } finally {
      setUnlockPending(false)
    }
  }

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
      const data = (await response.json()) as {
        error?: string
        ok?: boolean
        delivered?: boolean
      }
      setTestResult(
        response.ok
          ? data.delivered
            ? "Sent. Check your lock screen."
            : "Saved to lock screen history. Enable alerts on the phone for push."
          : (data.error ?? "Failed to send.")
      )
    } catch {
      setTestResult("Network error while sending.")
    } finally {
      setTesting(false)
    }
  }

  const connected = Boolean(status?.connected)

  return (
    <AppShell
      header={
        <ScreenHeader
          trailing={
            <SoftStatus tone={connected ? "ready" : "idle"}>
              {connected ? "Connected" : "Waiting"}
            </SoftStatus>
          }
        />
      }
    >
      <main className="flex flex-1 flex-col">
        <section className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">Your private channel</p>
          <h1 className="mt-1 font-heading text-4xl font-medium tracking-tight">
            {name}
          </h1>
          <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-muted-foreground">
            {creds
              ? connected
                ? "Phone is linked. Send a test anytime."
                : "Scan with your phone to install and enable alerts."
              : "Unlock to see your connect QR and API details."}
          </p>
        </section>

        {creds ? (
          <>
            <section className="mt-8 flex flex-1 flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 delay-75">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-[0_24px_60px_-36px_rgba(36,58,46,0.4)] backdrop-blur-sm">
                <QrCode value={connectUrl} size={200} />
              </div>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Open on your phone ·{" "}
                <span className="text-foreground">/connect/{name}</span>
              </p>
              <div className="mt-3">
                <CopyButton value={connectUrl} label="Copy link" />
              </div>
            </section>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-10 pb-1 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-13"
                onClick={() => {
                  setTestResult(null)
                  setSheet("test")
                }}
              >
                <SendIcon data-icon="inline-start" />
                Test
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-13"
                onClick={() => setSheet("api")}
              >
                <Code2Icon data-icon="inline-start" />
                API
              </Button>
            </div>
          </>
        ) : (
          <section className="mt-10 flex flex-1 flex-col justify-end pb-2 animate-in fade-in duration-500">
            <Button
              type="button"
              size="lg"
              className="h-14 w-full"
              onClick={() => setSheet("unlock")}
            >
              Unlock dashboard
            </Button>
          </section>
        )}
      </main>

      <BottomSheet
        open={sheet === "unlock"}
        onOpenChange={(open) => {
          if (!open && creds) setSheet(null)
        }}
      >
        <BottomSheetContent>
          <form onSubmit={onUnlock}>
            <BottomSheetHeader>
              <BottomSheetTitle>Unlock {name}</BottomSheetTitle>
              <BottomSheetDescription>
                Enter the API key from when you claimed this name.
              </BottomSheetDescription>
            </BottomSheetHeader>
            <BottomSheetBody>
              <Input
                type="password"
                value={unlockKey}
                onChange={(e) => setUnlockKey(e.target.value.trim())}
                placeholder="API key"
                className="h-13 border-border/80 bg-background/80 text-base"
                required
                minLength={16}
                autoFocus
              />
              {unlockError ? (
                <p className="text-sm text-destructive" role="alert">
                  {unlockError}
                </p>
              ) : null}
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button
                type="submit"
                size="lg"
                className="h-13 w-full"
                disabled={unlockPending || unlockKey.length < 16}
              >
                {unlockPending ? "Opening…" : "Unlock"}
              </Button>
            </BottomSheetFooter>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet
        open={sheet === "test"}
        onOpenChange={(open) => {
          if (!open) setSheet(null)
        }}
      >
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Send a test</BottomSheetTitle>
            <BottomSheetDescription>
              {connected
                ? "A gentle nudge to confirm everything works."
                : "Connect your phone first for a real delivery."}
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetBody>
            <Input
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Title"
              className="h-13 border-border/80 bg-background/80 text-base"
            />
            <Textarea
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              placeholder="Body"
              rows={3}
              className="min-h-24 border-border/80 bg-background/80 text-base"
            />
            {testResult ? (
              <p className="text-sm text-muted-foreground" role="status">
                {testResult}
              </p>
            ) : null}
          </BottomSheetBody>
          <BottomSheetFooter>
            <Button
              type="button"
              size="lg"
              className="h-13 w-full"
              onClick={() => void sendTest()}
              disabled={testing || !testTitle.trim()}
            >
              {testing ? "Sending…" : "Send test"}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet
        open={sheet === "api"}
        onOpenChange={(open) => {
          if (!open) setSheet(null)
        }}
      >
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>API details</BottomSheetTitle>
            <BottomSheetDescription>
              Endpoint, key, and a ready-to-copy curl example.
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetBody className="space-y-5">
            {creds ? (
              <>
                <FieldRow label="Notify URL" value={notifyUrl} />
                <FieldRow label="API key" value={creds.apiKey} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Example
                    </p>
                    <CopyButton value={curlExample} label="Copy curl" />
                  </div>
                  <pre className="overflow-x-auto rounded-2xl bg-muted/70 px-3.5 py-3 font-mono text-[11px] leading-relaxed">
                    {curlExample}
                  </pre>
                </div>
              </>
            ) : null}
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    </AppShell>
  )
}
