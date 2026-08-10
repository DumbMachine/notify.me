import type { SVGProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * notify.me app mark. Themeable via CSS variables:
 *   --notify-icon-bg     → background squircle (falls back to --primary)
 *   --notify-icon-fg     → bell (falls back to --primary-foreground)
 *   --notify-icon-badge  → notification dot (falls back to --accent)
 */
export function NotifyIcon({
  className,
  title = "notify.me",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      className={cn("notify-icon shrink-0", className)}
      {...props}
    >
      <title>{title}</title>
      <rect
        width="512"
        height="512"
        rx="114"
        fill="var(--notify-icon-bg, var(--primary))"
      />
      <path
        fill="var(--notify-icon-fg, var(--primary-foreground))"
        d="M256 92c-55 0-99 44-99 99v62c0 21-8 41-23 56l-14 14c-13 13-4 35 14 35h244c18 0 27-22 14-35l-14-14c-15-15-23-35-23-56v-62c0-55-44-99-99-99zm-48 302c10 22 28 34 48 34s38-12 48-34z"
      />
      <circle
        cx="352"
        cy="146"
        r="44"
        fill="var(--notify-icon-badge, var(--accent))"
      />
    </svg>
  )
}
