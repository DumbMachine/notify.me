import { useState, type FormEvent } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export const Route = createFileRoute("/")({ component: HomePage })

type ClaimResponse = {
  name: string
  apiKey: string
  notifyUrl: string
  connectUrl: string
  dashboardUrl: string
  connected: boolean
  error?: string
}

function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = (await response.json()) as ClaimResponse
      if (!response.ok) {
        setError(data.error ?? "Could not claim that name.")
        return
      }

      sessionStorage.setItem(
        `notify.me:${data.name}`,
        JSON.stringify({
          apiKey: data.apiKey,
          notifyUrl: data.notifyUrl,
          connectUrl: data.connectUrl,
        })
      )

      await navigate({ to: "/$name", params: { name: data.name } })
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

        <form
          onSubmit={onSubmit}
          className="mt-10 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150 fill-mode-both"
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
      </main>
    </div>
  )
}
