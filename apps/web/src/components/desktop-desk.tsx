import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ExternalLinkIcon, XIcon } from "lucide-react"

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
import { NotifyIcon } from "@/components/notify-icon"
import type { LockNotification } from "@/components/lock-screen"
import { cn } from "@workspace/ui/lib/utils"

function formatClock(date: Date) {
  return date.toLocaleTimeString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatRelative(createdAt: number, now: number) {
  const delta = Math.max(0, now - createdAt)
  const mins = Math.floor(delta / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function DeskAvatar({ src }: { src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-10 shrink-0 rounded-[0.7rem] object-cover"
      />
    )
  }
  return (
    <div className="size-10 shrink-0 overflow-hidden rounded-[0.7rem]">
      <NotifyIcon className="size-full" />
    </div>
  )
}

function DeskCard({
  item,
  now,
  highlighted,
  onOpen,
  onDismiss,
}: {
  item: LockNotification
  now: number
  highlighted?: boolean
  onOpen: () => void
  onDismiss: () => void
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/14 bg-white/14 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-[background-color,transform] duration-300 hover:bg-white/18",
        highlighted && "ring-1 ring-[oklch(0.67_0.29_341_/_0.7)]"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-start"
      >
        <DeskAvatar src={item.imageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[12px] font-semibold tracking-wide text-white/85">
              notify.me
            </p>
            <span className="shrink-0 text-[11px] text-white/50">
              {formatRelative(item.createdAt, now)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[14px] font-semibold text-white">
            {item.title}
          </p>
          {item.body ? (
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/65">
              {item.body}
            </p>
          ) : null}
          {item.mediaUrl || item.imageUrl ? (
            <div className="mt-2 overflow-hidden rounded-xl">
              {item.mediaUrl && item.mediaType === "video" ? (
                <div className="relative aspect-video bg-black/40">
                  <video
                    src={item.mediaUrl}
                    className="size-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : (
                <img
                  src={item.mediaUrl || item.imageUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              )}
            </div>
          ) : null}
        </div>
      </button>
      <button
        type="button"
        aria-label="Clear notification"
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-black/25 text-white/70 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-black/40 hover:text-white"
      >
        <XIcon className="size-3.5" />
      </button>
    </article>
  )
}

export function DesktopDesk({
  name,
  notifications,
  focusId,
  footer,
  className,
}: {
  name: string
  notifications: LockNotification[]
  focusId?: string
  footer?: ReactNode
  className?: string
}) {
  const [now, setNow] = useState(() => new Date())
  const [openId, setOpenId] = useState<string | null>(focusId ?? null)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (focusId) setOpenId(focusId)
  }, [focusId])

  const stamp = now.getTime()
  const items = useMemo(
    () =>
      [...notifications]
        .filter((item) => !dismissed.has(item.id))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 24),
    [notifications, dismissed]
  )
  const openItem = items.find((item) => item.id === openId) ?? null

  function dismiss(id: string) {
    setDismissed((current) => new Set(current).add(id))
    if (openId === id) setOpenId(null)
  }

  return (
    <div
      className={cn(
        "relative flex min-h-svh flex-col overflow-hidden text-white",
        className
      )}
    >
      <div aria-hidden className="absolute inset-0">
        <picture>
          <source srcSet="/hero-bg.avif" type="image/avif" />
          <img
            src="/hero-bg.jpg"
            alt=""
            className="size-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.18)_35%,rgba(0,0,0,0.45)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_20%,oklch(0.67_0.29_341_/_0.22),transparent_55%)]" />
      </div>

      {/* Menu bar */}
      <header className="relative z-20 flex h-8 items-center justify-between border-b border-white/8 bg-black/25 px-4 text-[12px] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight">Notify.me</span>
          <span className="text-white/45">/</span>
          <span className="text-white/70">{name}</span>
        </div>
        <div className="flex items-center gap-3 text-white/75">
          <span className="tabular-nums">{formatClock(now)}</span>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* Desktop “workspace” — empty stage so the wallpaper reads as a real desk */}
        <div className="hidden min-w-0 flex-1 lg:block" aria-hidden />

        {/* Notification Center */}
        <aside className="ms-auto flex w-full max-w-[24rem] flex-col border-s border-white/10 bg-black/20 px-3 pt-3 pb-3 backdrop-blur-2xl sm:max-w-[26rem] sm:px-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h1 className="text-[13px] font-semibold tracking-wide text-white/85">
              Notification Center
            </h1>
            {items.length > 0 ? (
              <button
                type="button"
                className="text-[11px] text-white/50 transition-colors hover:text-white/80"
                onClick={() =>
                  setDismissed(new Set(items.map((item) => item.id)))
                }
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pe-0.5">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-6 text-center backdrop-blur-xl">
                <p className="text-[14px] font-medium text-white/90">
                  Quiet desk
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                  New pings land here like macOS notifications — rich media and
                  links included.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <DeskCard
                  key={item.id}
                  item={item}
                  now={stamp}
                  highlighted={item.id === focusId || item.id === openId}
                  onOpen={() => setOpenId(item.id)}
                  onDismiss={() => dismiss(item.id)}
                />
              ))
            )}
          </div>

          {footer ? <div className="mt-3 shrink-0">{footer}</div> : null}
        </aside>
      </div>

      <BottomSheet
        open={Boolean(openItem)}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
      >
        <BottomSheetContent className="bg-card text-card-foreground">
          {openItem ? (
            <>
              <BottomSheetHeader>
                <div className="flex items-start gap-3">
                  <DeskAvatar src={openItem.imageUrl} />
                  <div className="min-w-0 flex-1 text-left">
                    <BottomSheetTitle className="text-left">
                      {openItem.title}
                    </BottomSheetTitle>
                    <BottomSheetDescription className="text-left">
                      {formatRelative(openItem.createdAt, stamp)} · notify.me/
                      {name}
                    </BottomSheetDescription>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setOpenId(null)}
                  >
                    <XIcon />
                  </Button>
                </div>
              </BottomSheetHeader>
              <BottomSheetBody className="space-y-4">
                {openItem.body ? (
                  <p className="text-[15px] leading-relaxed text-foreground">
                    {openItem.body}
                  </p>
                ) : null}
                {openItem.mediaUrl && openItem.mediaType === "video" ? (
                  <video
                    src={openItem.mediaUrl}
                    className="w-full rounded-lg bg-muted"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : null}
                {openItem.mediaUrl && openItem.mediaType !== "video" ? (
                  <img
                    src={openItem.mediaUrl}
                    alt=""
                    className="w-full rounded-lg object-cover"
                  />
                ) : null}
                {!openItem.mediaUrl && openItem.imageUrl ? (
                  <img
                    src={openItem.imageUrl}
                    alt=""
                    className="w-full rounded-lg object-cover"
                  />
                ) : null}
              </BottomSheetBody>
              <BottomSheetFooter>
                {openItem.url ? (
                  <Button
                    nativeButton={false}
                    size="lg"
                    className="h-12 w-full"
                    render={
                      <a href={openItem.url} target="_blank" rel="noreferrer" />
                    }
                  >
                    <ExternalLinkIcon data-icon="inline-start" />
                    Open link
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-12 w-full"
                  onClick={() => dismiss(openItem.id)}
                >
                  Clear notification
                </Button>
              </BottomSheetFooter>
            </>
          ) : null}
        </BottomSheetContent>
      </BottomSheet>
    </div>
  )
}
