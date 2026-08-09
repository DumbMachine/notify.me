import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"

import { cn } from "@workspace/ui/lib/utils"

export function AppShell({
  children,
  className,
  header,
}: {
  children: ReactNode
  className?: string
  header?: ReactNode
}) {
  return (
    <div className={cn("relative min-h-svh atmosphere", className)}>
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col safe-px safe-pt safe-pb sm:max-w-lg">
        {header}
        {children}
      </div>
    </div>
  )
}

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg" | "hero"
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-4xl",
    hero: "text-[3.25rem] leading-[0.92] sm:text-6xl",
  } as const

  return (
    <Link
      to="/"
      className={cn(
        "font-heading font-medium tracking-tight text-foreground",
        sizes[size],
        className
      )}
    >
      notify.me
    </Link>
  )
}

export function SoftStatus({
  tone = "idle",
  children,
}: {
  tone?: "idle" | "ready" | "warn"
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        tone === "ready" && "bg-primary/12 text-primary",
        tone === "idle" && "bg-secondary/90 text-secondary-foreground",
        tone === "warn" && "bg-accent text-accent-foreground"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "ready" && "bg-primary",
          tone === "idle" && "bg-muted-foreground/45",
          tone === "warn" && "bg-accent-foreground/70"
        )}
      />
      {children}
    </span>
  )
}

export function ScreenHeader({
  trailing,
}: {
  trailing?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between gap-3 py-3">
      <BrandMark size="sm" />
      {trailing}
    </header>
  )
}
