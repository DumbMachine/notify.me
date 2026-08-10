/** Public HTTPS URL checks for rich notification media (Hark-style). */

const BLOCKED_HOST_RE =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|\[::1\]|.*\.local)$/i

export function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    if (!url.hostname || BLOCKED_HOST_RE.test(url.hostname)) return false
    return true
  } catch {
    return false
  }
}

export type RichNotifyInput = {
  title: string
  body?: string
  /** Optional external / deep link shown inside the lock-screen detail. */
  url?: string
  /** Avatar / small icon URL. */
  imageUrl?: string
  /** Large attachment shown on lock screen (screenshot or poster). */
  mediaUrl?: string
  mediaType?: "image" | "video"
}

export type ParsedNotifyPayload =
  | { ok: true; value: RichNotifyInput }
  | { ok: false; error: string }

function readString(
  body: Record<string, unknown>,
  key: string,
  max: number
): string | undefined {
  const raw = body[key]
  if (typeof raw !== "string") return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (trimmed.length > max) return undefined
  return trimmed
}

export function parseNotifyPayload(body: unknown): ParsedNotifyPayload {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid JSON body." }
  }
  const record = body as Record<string, unknown>

  const title = readString(record, "title", 120)
  if (!title) {
    return { ok: false, error: "Field `title` is required (max 120 chars)." }
  }

  const messageBody = readString(record, "body", 2000)
  const url = readString(record, "url", 2048)
  const imageUrl =
    readString(record, "imageUrl", 2048) ?? readString(record, "image", 2048)
  const mediaUrl =
    readString(record, "mediaUrl", 2048) ?? readString(record, "media", 2048)

  let mediaType: "image" | "video" | undefined
  const mediaTypeRaw = readString(record, "mediaType", 16)
  if (mediaTypeRaw === "image" || mediaTypeRaw === "video") {
    mediaType = mediaTypeRaw
  } else if (mediaUrl) {
    mediaType = /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl) ? "video" : "image"
  }

  for (const [label, value] of [
    ["url", url],
    ["imageUrl", imageUrl],
    ["mediaUrl", mediaUrl],
  ] as const) {
    if (value && !isPublicHttpsUrl(value)) {
      return {
        ok: false,
        error: `Field \`${label}\` must be a public https URL.`,
      }
    }
  }

  return {
    ok: true,
    value: {
      title,
      body: messageBody,
      url,
      imageUrl,
      mediaUrl,
      mediaType,
    },
  }
}
