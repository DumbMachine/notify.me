import { useEffect, useMemo, useState, type ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export type LockNotification = {
  id: string
  title: string
  body: string
  url?: string
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

function NotificationCard({
  item,
  now,
  index,
}: {
  item: LockNotification
  now: number
  index: number
}) {
  return (
    <article
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 rounded-[1.35rem] border border-white/18 bg-white/18 px-3.5 py-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)] backdrop-blur-2xl duration-500",
        index === 0 && "bg-white/22"
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-gradient-to-br from-emerald-200/90 to-teal-700 text-[10px] font-semibold tracking-wide text-white shadow-sm">
          n
        </div>
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
    </article>
  )
}

export function LockScreen({
  name,
  notifications,
  footer,
  className,
}: {
  name: string
  notifications: LockNotification[]
  footer?: ReactNode
  className?: string
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const stamp = now.getTime()
  const items = useMemo(
    () =>
      [...notifications].sort((a, b) => b.createdAt - a.createdAt).slice(0, 24),
    [notifications]
  )

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
                Notifications sent to this name will collect here — even if push
                isn’t enabled yet.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item, index) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  now={stamp}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {footer ? <div className="relative z-10 pt-2">{footer}</div> : null}
      </div>
    </div>
  )
}
