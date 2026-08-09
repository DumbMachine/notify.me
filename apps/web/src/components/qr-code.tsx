import { useEffect, useState } from "react"
import QRCode from "qrcode"

import { cn } from "@workspace/ui/lib/utils"

export function QrCode({
  value,
  className,
  size = 220,
}: {
  value: string
  className?: string
  size?: number
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0f766e", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        className={cn("animate-pulse bg-muted", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className={cn("bg-white p-2", className)}
    />
  )
}
