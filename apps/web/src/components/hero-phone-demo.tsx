import { useEffect, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

type MediaKind = "deploy" | "logs" | "video"

type DemoNote = {
  id: string
  title: string
  body: string
  media?: MediaKind
}

const DEMO_SCRIPT: Omit<DemoNote, "id">[] = [
  {
    title: "New signup",
    body: "alex just claimed a name.",
  },
  {
    title: "CI failed",
    body: "web · typecheck · main",
    media: "logs",
  },
  {
    title: "Deploy finished",
    body: "Production is live. Screenshot attached.",
    media: "deploy",
  },
  {
    title: "Hello from curl",
    body: "One API call. Straight to lock screen.",
  },
  {
    title: "Agent done",
    body: "Recording preview clip attached.",
    media: "video",
  },
]

type Phase = "push" | "expand" | "swipe" | "hold" | "clear"

const STEP_MS = 1500
const EXPAND_MS = 2400
const SWIPE_MS = 900
const HOLD_MS = 1400
const CLEAR_MS = 700

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

function DeployPreview({ tall }: { tall?: boolean }) {
  return (
    <div
      className={cn(
        "relative mt-2 overflow-hidden rounded-[0.9rem] border border-white/15 bg-[#10241f]",
        tall ? "h-[7.25rem]" : "h-[4.35rem]"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(125,211,192,0.35),transparent_55%),linear-gradient(180deg,#1a3b34,#0d1c19)]" />
      <div className="relative flex h-full flex-col justify-between p-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-400/20 text-[11px] text-emerald-200">
            ✓
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-white">
              Production deploy
            </p>
            <p className="truncate text-[8px] text-white/55">main · 42s</p>
          </div>
          <span className="ms-auto rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[8px] font-medium text-emerald-200">
            live
          </span>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-emerald-300/80" />
          </div>
          {tall ? (
            <div className="grid grid-cols-3 gap-1 pt-1">
              {["build", "test", "ship"].map((step) => (
                <div
                  key={step}
                  className="rounded-md bg-white/8 px-1.5 py-1 text-center text-[8px] text-white/70"
                >
                  {step}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function LogsPreview({ tall }: { tall?: boolean }) {
  const lines = [
    { tone: "muted", text: "$ pnpm typecheck" },
    { tone: "bad", text: "error TS2322: Type 'null' is not assignable" },
    { tone: "muted", text: "at apps/web/src/routes/$name.tsx:88" },
    { tone: "bad", text: "✖ 1 error  web · typecheck · main" },
  ]
  return (
    <div
      className={cn(
        "relative mt-2 overflow-hidden rounded-[0.9rem] border border-white/12 bg-[#140f10]",
        tall ? "h-[7.25rem]" : "h-[4.35rem]"
      )}
    >
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1">
        <span className="size-1.5 rounded-full bg-rose-400/80" />
        <span className="size-1.5 rounded-full bg-amber-300/70" />
        <span className="size-1.5 rounded-full bg-emerald-300/60" />
        <span className="ms-1 text-[8px] text-white/45">ci.log</span>
      </div>
      <div className="space-y-0.5 px-2 py-1.5 font-mono">
        {(tall ? lines : lines.slice(0, 2)).map((line) => (
          <p
            key={line.text}
            className={cn(
              "truncate text-[8px] leading-relaxed",
              line.tone === "bad" ? "text-rose-300" : "text-white/55"
            )}
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}

function VideoPreview({ tall }: { tall?: boolean }) {
  return (
    <div
      className={cn(
        "relative mt-2 overflow-hidden rounded-[0.9rem] border border-white/15",
        tall ? "h-[7.25rem]" : "h-[4.35rem]"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(160,210,255,0.45),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(40,90,140,0.7),transparent_50%),linear-gradient(145deg,#2a4d6e,#102033)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:12px_12px]" />

      <div className="relative flex h-full flex-col justify-between p-2.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-semibold text-white">agent-preview</p>
            <p className="text-[8px] text-white/55">0:12 · HD</p>
          </div>
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-[8px] text-white/80">
            REC
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <span className="ms-0.5 text-[11px]">▶</span>
          </div>
          {tall ? (
            <div className="w-full space-y-1">
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-2/5 rounded-full bg-white/85" />
              </div>
              <div className="flex justify-between text-[8px] text-white/55">
                <span>0:05</span>
                <span>0:12</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MediaPreview({
  kind,
  tall,
}: {
  kind: MediaKind
  tall?: boolean
}) {
  switch (kind) {
    case "deploy":
      return <DeployPreview tall={tall} />
    case "logs":
      return <LogsPreview tall={tall} />
    case "video":
      return <VideoPreview tall={tall} />
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function cardHeight(note: DemoNote, expanded: boolean, isFront: boolean) {
  if (!isFront) return "4.35rem"
  if (!note.media) return expanded ? "5.1rem" : "4.35rem"
  return expanded ? "11.1rem" : "8.15rem"
}

function DemoNotification({
  note,
  index,
  expanded,
  swiping,
}: {
  note: DemoNote
  index: number
  expanded: boolean
  swiping: boolean
}) {
  const depth = Math.min(index, 3)
  const isFront = index === 0

  return (
    <article
      className={cn(
        "absolute inset-x-0 top-0 origin-top overflow-hidden rounded-[1.25rem] border border-white/25 bg-white/28 shadow-[0_14px_36px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded && isFront && "bg-white/34",
        !isFront && "pointer-events-none"
      )}
      style={{
        height: cardHeight(note, expanded, isFront),
        transform: swiping && isFront
          ? "translate3d(118%, 0, 0) rotate(7deg)"
          : `translateY(${depth * 9}px) scale(${1 - depth * 0.035})`,
        opacity: depth > 2 ? 0 : swiping && isFront ? 0 : isFront ? 1 : 0.55,
        zIndex: 40 - index,
        filter: isFront ? undefined : "brightness(0.82)",
      }}
    >
      {/* Behind cards: frosted peeks only — hide readable content to avoid overlap */}
      {!isFront ? (
        <div className="h-full bg-white/10" aria-hidden />
      ) : (
        <div className="px-3 py-2.5">
          <div className="flex items-start gap-2.5">
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
              <p
                className={cn(
                  "text-[11px] leading-snug text-white/70",
                  expanded ? "line-clamp-2" : "truncate"
                )}
              >
                {note.body}
              </p>
            </div>
          </div>
          {note.media ? (
            <MediaPreview kind={note.media} tall={expanded} />
          ) : null}
        </div>
      )}
    </article>
  )
}

export function HeroPhoneDemo({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  const [notes, setNotes] = useState<DemoNote[]>([])
  const [scriptIndex, setScriptIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("push")
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
        [
          DEMO_SCRIPT[0]!,
          DEMO_SCRIPT[2]!,
          DEMO_SCRIPT[1]!,
        ].map((item, i) => ({ ...item, id: `static-${i}` }))
      )
      return
    }

    let timer = 0

    if (phase === "push") {
      timer = window.setTimeout(() => {
        const item = DEMO_SCRIPT[scriptIndex]
        if (!item) return
        setNotes((current) =>
          [{ ...item, id: `${scriptIndex}-${Date.now()}` }, ...current].slice(
            0,
            3
          )
        )
        if (scriptIndex >= DEMO_SCRIPT.length - 1) {
          setPhase("expand")
        } else {
          setScriptIndex((value) => value + 1)
        }
      }, scriptIndex === 0 ? 500 : STEP_MS)
    } else if (phase === "expand") {
      timer = window.setTimeout(() => setPhase("swipe"), EXPAND_MS)
    } else if (phase === "swipe") {
      timer = window.setTimeout(() => {
        setNotes((current) => current.slice(1))
        setPhase("hold")
      }, SWIPE_MS)
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

  const expanded = phase === "expand"
  const swiping = phase === "swipe"
  const front = notes[0]
  const stackHeight = front?.media
    ? expanded
      ? "12rem"
      : "9rem"
    : "5.2rem"

  return (
    <div className={cn("relative mx-auto w-full max-w-[280px]", className)}>
      {/* Soft lift only — scenic page BG provides atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[50%] bg-[radial-gradient(circle,rgba(0,0,0,0.28),transparent_70%)] blur-xl"
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
                "relative mt-7 overflow-hidden transition-[height,opacity] duration-500",
                phase === "clear" && "opacity-0"
              )}
              style={{ height: stackHeight }}
            >
              {notes.map((note, index) => (
                <DemoNotification
                  key={note.id}
                  note={note}
                  index={index}
                  expanded={expanded}
                  swiping={swiping}
                />
              ))}
            </div>

            <p className="mt-3 text-center text-[10px] tracking-wide text-white/45 transition-opacity duration-300">
              {phase === "expand"
                ? "Tap opens rich detail"
                : phase === "swipe"
                  ? "Swipe to clear"
                  : "Screenshots · video · links"}
            </p>

            <div className="mt-auto flex flex-col items-center gap-3 pt-4">
              <div className="h-1 w-28 rounded-full bg-white/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
