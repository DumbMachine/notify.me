import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
import { cn } from "@workspace/ui/lib/utils"

export type LockNotification = {
  id: string
  title: string
  body: string
  url?: string
  imageUrl?: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  createdAt: number
  delivered?: boolean
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function formatRelative(createdAt: number, now: number) {
  const delta = Math.max(0, now - createdAt)
  const mins = Math.floor(delta / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function Avatar({ src, className }: { src?: string; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          "mt-0.5 size-9 shrink-0 rounded-[0.85rem] object-cover shadow-sm",
          className
        )}
      />
    )
  }
  return (
    <div
      className={cn(
        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-gradient-to-br from-emerald-200/90 to-teal-700 text-[10px] font-semibold tracking-wide text-white shadow-sm",
        className
      )}
    >
      n
    </div>
  )
}

function SwipeableCard({
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
  const startX = useRef(0)
  const startY = useRef(0)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const axis = useRef<"x" | "y" | null>(null)

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    startX.current = event.clientX
    startY.current = event.clientY
    axis.current = null
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging) return
    const moveX = event.clientX - startX.current
    const moveY = event.clientY - startY.current
    if (!axis.current) {
      if (Math.abs(moveX) < 8 && Math.abs(moveY) < 8) return
      axis.current = Math.abs(moveX) > Math.abs(moveY) ? "x" : "y"
    }
    if (axis.current === "x") {
      setDx(moveX)
    }
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
    if (axis.current === "x" && Math.abs(dx) > 110) {
      onDismiss()
      setDx(0)
      return
    }
    if (axis.current === null && Math.abs(dx) < 8) {
      onOpen()
    }
    setDx(0)
    axis.current = null
  }

  const hasMedia = Boolean(item.mediaUrl)
  const opacity = Math.max(0.2, 1 - Math.abs(dx) / 220)

  return (
    <article
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "touch-pan-y select-none rounded-[1.35rem] border border-white/18 bg-white/18 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[box-shadow,background-color] duration-300",
        highlighted && "ring-2 ring-white/45 bg-white/24",
        !dragging && "transition-transform duration-300 ease-out"
      )}
      style={{
        transform: `translate3d(${dx}px, 0, 0) rotate(${dx / 48}deg)`,
        opacity,
      }}
    >
      <div className="px-3.5 py-3">
        <div className="flex items-start gap-3">
          <Avatar src={item.imageUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-[13px] font-semibold tracking-wide text-white/92">
                notify.me
              </p>
              <time className="shrink-0 text-[11px] text-white/55">
                {formatRelative(item.createdAt, now)}
              </time>
            </div>
            <p className="mt-0.5 truncate text-[15px] font-semibold text-white">
              {item.title}
            </p>
            {item.body ? (
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/72">
                {item.body}
              </p>
            ) : null}
          </div>
        </div>

        {hasMedia && item.mediaType !== "video" ? (
          <div className="mt-3 overflow-hidden rounded-[1rem]">
            <img
              src={item.mediaUrl}
              alt=""
              className="h-36 w-full object-cover"
              draggable={false}
            />
          </div>
        ) : null}

        {hasMedia && item.mediaType === "video" ? (
          <div className="mt-3 overflow-hidden rounded-[1rem] bg-black/35">
            <video
              src={item.mediaUrl}
              className="h-36 w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function LockScreen({
  name,
  notifications,
  focusId,
  footer,
  className,
  onDismiss,
}: {
  name: string
  notifications: LockNotification[]
  focusId?: string | null
  footer?: ReactNode
  className?: string
  onDismiss?: (id: string) => void
}) {
  const [now, setNow] = useState(() => new Date())
  const [openId, setOpenId] = useState<string | null>(null)
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
    onDismiss?.(id)
  }

  return (
    <div
      className={cn(
        "relative flex min-h-svh flex-col overflow-hidden text-white",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_20%_-10%,rgba(180,220,190,0.28),transparent_50%),radial-gradient(ellipse_90%_70%_at_90%_10%,rgba(90,140,160,0.35),transparent_45%),linear-gradient(180deg,#1a2c28_0%,#0f1a18_42%,#0a1211_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.06)_0.6px,transparent_0.6px)] [background-size:3px_3px]"
      />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between pt-1 text-[13px] text-white/70">
          <span className="font-medium tracking-wide">{name}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] tracking-wide backdrop-blur-md">
            Lock Screen
          </span>
        </header>

        <div className="mt-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
          <p className="whitespace-nowrap font-heading text-[5.25rem] leading-none font-medium tracking-tight tabular-nums text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            {formatClock(now)}
          </p>
          <p className="mt-3 text-[17px] font-medium tracking-wide text-white/80">
            {formatDate(now)}
          </p>
        </div>

        <div className="mt-10 flex min-h-0 flex-1 flex-col">
          {items.length === 0 ? (
            <div className="mt-6 rounded-[1.35rem] border border-white/12 bg-white/10 px-5 py-6 text-center backdrop-blur-xl animate-in fade-in duration-500">
              <p className="text-[15px] font-medium text-white/90">
                Waiting for the first ping
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Tap a system notification anytime to land here. Swipe cards
                aside to clear; tap to open rich detail.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item) => (
                <SwipeableCard
                  key={item.id}
                  item={item}
                  now={stamp}
                  highlighted={item.id === focusId || item.id === openId}
                  onOpen={() => setOpenId(item.id)}
                  onDismiss={() => dismiss(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {footer ? <div className="relative z-10 pt-2">{footer}</div> : null}
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
                  <Avatar src={openItem.imageUrl} className="mt-0 size-10" />
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
                    className="w-full rounded-2xl bg-muted"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : null}

                {openItem.mediaUrl && openItem.mediaType !== "video" ? (
                  <img
                    src={openItem.mediaUrl}
                    alt=""
                    className="w-full rounded-2xl object-cover"
                  />
                ) : null}

                {!openItem.mediaUrl && openItem.imageUrl ? (
                  <img
                    src={openItem.imageUrl}
                    alt=""
                    className="w-full rounded-2xl object-cover"
                  />
                ) : null}
              </BottomSheetBody>
              <BottomSheetFooter>
                {openItem.url ? (
                  <Button
                    nativeButton={false}
                    size="lg"
                    className="h-13 w-full"
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
