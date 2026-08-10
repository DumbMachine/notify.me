import { useEffect, useState, type FormEvent } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  KeyRoundIcon,
  QrCodeIcon,
  SparklesIcon,
} from "lucide-react"

import { BrandMark } from "@/components/app-shell"
import { HeroPhoneDemo } from "@/components/hero-phone-demo"
import { isStandaloneDisplay } from "@/lib/device"
import {
  getBoundDevice,
  getLastName,
  loadCreds,
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
        className="h-12 ps-[5.9rem] text-base md:text-sm"
        required
        minLength={3}
        maxLength={32}
        pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
      />
    </div>
  )
}

function ContinueActions({
  name,
  canManage,
  onInbox,
  onManage,
}: {
  name: string
  canManage: boolean
  onInbox: () => void
  onManage: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onInbox}
        className="flex h-12 items-center justify-between gap-3 bg-card px-3 text-start ring-1 ring-foreground/10 transition-colors hover:bg-muted"
      >
        <span className="text-sm text-muted-foreground">Open inbox</span>
        <span className="flex items-center gap-2 font-medium">
          {name}
          <ArrowRightIcon className="size-4 opacity-60" />
        </span>
      </button>
      {canManage ? (
        <button
          type="button"
          onClick={onManage}
          className="flex h-10 items-center justify-between gap-3 px-3 text-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <QrCodeIcon className="size-3.5 opacity-70" />
            Manage QR &amp; API
          </span>
          <span className="font-medium text-foreground">{name}</span>
        </button>
      ) : null}
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
  const [continueName, setContinueName] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    const bound = getBoundDevice()
    const last = getLastName()
    const next = bound ?? last
    setContinueName(next)
    setCanManage(Boolean(next && loadCreds(next)))
    if (last) setName((current) => current || last)

    // Phone Home Screen apps jump straight into the inbox.
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
    // Claim/login land in Manage so you can scan QR / grab the API key.
    await navigate({ to: "/$name", params: { name: data.name } })
  }

  async function onClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
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
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, apiKey }),
      })
      const data = (await response.json()) as SessionResponse
      if (!response.ok) {
        setError(data.error ?? "Could not open that channel.")
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
    <div className="relative min-h-svh overflow-hidden atmosphere">
      <div aria-hidden className="haze-orbs" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col safe-px safe-pt safe-pb lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center lg:gap-10 lg:px-10">
        <section className="flex flex-col pt-6 lg:pt-0 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <BrandMark size="lg" className="w-fit" />
          <h1 className="mt-5 max-w-[16ch] font-heading text-[2.35rem] leading-[0.98] font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            From API to your screen.
          </h1>
          <p className="mt-4 max-w-[28rem] text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
            Claim a name, connect a device, and push rich notifications —
            phone lock screen on mobile, notification desk on desktop.
          </p>

          <div className="mt-8 hidden flex-col gap-3 sm:max-w-sm lg:flex">
            {continueName ? (
              <ContinueActions
                name={continueName}
                canManage={canManage}
                onInbox={() =>
                  void navigate({
                    to: "/connect/$name",
                    params: { name: continueName },
                  })
                }
                onManage={() =>
                  void navigate({
                    to: "/$name",
                    params: { name: continueName },
                  })
                }
              />
            ) : null}
            <Button
              type="button"
              size="lg"
              className="h-12 w-full text-sm"
              onClick={() => openSheet("claim")}
            >
              <SparklesIcon data-icon="inline-start" />
              Claim a name
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="h-10 w-full"
              onClick={() => openSheet("login")}
            >
              <KeyRoundIcon data-icon="inline-start" />
              I already have one
            </Button>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center py-8 lg:py-10 animate-in fade-in zoom-in-95 duration-700 delay-100">
          <div className="relative w-full max-w-[22rem] overflow-hidden rounded-xl ring-1 ring-foreground/10 p-5 sm:max-w-[24rem] sm:p-7">
            <div aria-hidden className="absolute inset-0">
              <picture>
                <source srcSet="/hero-bg.avif" type="image/avif" />
                <img
                  src="/hero-bg.jpg"
                  alt=""
                  className="size-full object-cover object-center"
                />
              </picture>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0_0_0_/_0.35),oklch(0.67_0.29_341_/_0.28)_45%,oklch(0_0_0_/_0.55))]" />
            </div>
            <div className="relative mx-auto w-full max-w-[280px]">
              <HeroPhoneDemo className="max-w-none" />
            </div>
          </div>
        </section>

        <section className="mt-auto flex flex-col gap-3 pb-2 lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {continueName ? (
            <ContinueActions
              name={continueName}
              canManage={canManage}
              onInbox={() =>
                void navigate({
                  to: "/connect/$name",
                  params: { name: continueName },
                })
              }
              onManage={() =>
                void navigate({
                  to: "/$name",
                  params: { name: continueName },
                })
              }
            />
          ) : null}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-sm"
            onClick={() => openSheet("claim")}
          >
            <SparklesIcon data-icon="inline-start" />
            Claim a name
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-10 w-full"
            onClick={() => openSheet("login")}
          >
            <KeyRoundIcon data-icon="inline-start" />
            I already have one
          </Button>
        </section>
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
                  You’ll land in Manage next — scan the QR to open your inbox.
                </p>
              )}
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full"
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
                Open Manage with your name and API key — QR, API, and tests live
                there.
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
                className="h-12 text-base md:text-sm"
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
                className="h-12 w-full"
                disabled={
                  pending || name.trim().length < 3 || apiKey.length < 16
                }
              >
                {pending ? "Opening…" : "Open Manage"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </BottomSheetFooter>
          </form>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  )
}
