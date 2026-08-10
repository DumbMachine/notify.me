import { useEffect, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

type DemoNote = {
  id: string
  title: string
  body: string
}

const DEMO_SCRIPT: Omit<DemoNote, "id">[] = [
  {
    title: "Deploy finished",
    body: "notify.me is live on production.",
  },
  {
    title: "New signup",
    body: "alex just claimed a name.",
  },
  {
    title: "CI failed",
    body: "web · typecheck · main",
  },
  {
    title: "Agent done",
    body: "PR is ready for review.",
  },
  {
    title: "Hello from curl",
    body: "One API call. Straight to lock screen.",
  },
]

const STEP_MS = 1700
const HOLD_MS = 2600
const CLEAR_MS = 900

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function DemoNotification({
  note,
  index,
}: {
  note: DemoNote
  index: number
}) {
  const depth = Math.min(index, 3)
  return (
    <article
      className="absolute inset-x-0 top-0 origin-top overflow-hidden rounded-[1.25rem] border border-white/25 bg-white/28 shadow-[0_14px_36px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        height: "4.35rem",
        transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`,
        opacity: depth > 2 ? 0 : 1 - depth * 0.12,
        zIndex: 40 - index,
        filter: depth > 0 ? `brightness(${1 - depth * 0.06})` : undefined,
      }}
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-gradient-to-br from-emerald-200 to-teal-800 text-[10px] font-semibold text-white">
          n
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[11px] font-semibold tracking-wide text-white/90">
              notify.me
            </p>
            <span className="text-[10px] text-white/55">now</span>
          </div>
          <p className="truncate text-[13px] font-semibold text-white">
            {note.title}
          </p>
          <p className="truncate text-[11px] leading-snug text-white/70">
            {note.body}
          </p>
        </div>
      </div>
    </article>
  )
}

export function HeroPhoneDemo({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  const [notes, setNotes] = useState<DemoNote[]>([])
  const [scriptIndex, setScriptIndex] = useState(0)
  const [phase, setPhase] = useState<"push" | "hold" | "clear">("push")
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setNotes(
        DEMO_SCRIPT.slice(0, 3).map((item, i) => ({
          ...item,
          id: `static-${i}`,
        }))
      )
      return
    }

    let timer = 0

    if (phase === "push") {
      timer = window.setTimeout(() => {
        const item = DEMO_SCRIPT[scriptIndex]
        if (!item) return
        setNotes((current) => [
          { ...item, id: `${scriptIndex}-${Date.now()}` },
          ...current,
        ].slice(0, 4))
        if (scriptIndex >= DEMO_SCRIPT.length - 1) {
          setPhase("hold")
        } else {
          setScriptIndex((value) => value + 1)
        }
      }, scriptIndex === 0 ? 600 : STEP_MS)
    } else if (phase === "hold") {
      timer = window.setTimeout(() => setPhase("clear"), HOLD_MS)
    } else {
      timer = window.setTimeout(() => {
        setNotes([])
        setScriptIndex(0)
        setPhase("push")
      }, CLEAR_MS)
    }

    return () => window.clearTimeout(timer)
  }, [phase, scriptIndex, reducedMotion])

  return (
    <div className={cn("relative mx-auto w-full max-w-[280px]", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[50%] bg-[radial-gradient(circle,oklch(0.72_0.08_155/0.35),transparent_68%)] blur-2xl"
      />

      <div className="relative aspect-[9/17.5] w-full overflow-hidden rounded-[2.35rem] border border-foreground/15 bg-[#0c1412] shadow-[0_40px_80px_-28px_rgba(20,40,34,0.55),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="absolute inset-[0.35rem] overflow-hidden rounded-[2rem]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_30%_0%,rgba(170,210,190,0.28),transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_20%,rgba(80,130,140,0.35),transparent_50%),linear-gradient(180deg,#243f38_0%,#13221e_45%,#0b1412_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.08)_0.7px,transparent_0.7px)] [background-size:3px_3px]"
          />

          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 z-30 h-[1.55rem] w-[5.5rem] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />

          <div className="relative z-10 flex h-full flex-col px-3.5 pt-12 pb-5 text-white">
            <div className="flex flex-col items-center text-center">
              <p className="whitespace-nowrap font-heading text-[3.35rem] leading-none font-medium tracking-tight tabular-nums drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                {formatClock(now)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium tracking-wide text-white/75">
                {formatDate(now)}
              </p>
            </div>

            <div
              className={cn(
                "relative mt-8 h-[5.6rem] overflow-hidden transition-opacity duration-500",
                phase === "clear" && "opacity-0"
              )}
            >
              {notes.map((note, index) => (
                <DemoNotification key={note.id} note={note} index={index} />
              ))}
            </div>

            <div className="mt-auto flex flex-col items-center gap-3 pt-6">
              <div className="h-1 w-28 rounded-full bg-white/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
