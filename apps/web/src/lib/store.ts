import { Redis } from "@upstash/redis"

export type PushSubscriptionJSON = {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export type Channel = {
  name: string
  apiKey: string
  subscription: PushSubscriptionJSON | null
  createdAt: number
}

type ChannelMap = Record<string, Channel>

const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/
const JSONBLOB_ID =
  process.env.NOTIFY_STORE_BLOB_ID ?? "019fe5ff-e013-7215-929b-3423b10fd618"
const JSONBLOB_URL = `https://jsonblob.com/api/jsonBlob/${JSONBLOB_ID}`

declare global {
  // eslint-disable-next-line no-var
  var __notifyMeChannels: ChannelMap | undefined
  // eslint-disable-next-line no-var
  var __notifyMeStoreBackend: "upstash" | "jsonblob" | "memory" | undefined
}

function memoryStore(): ChannelMap {
  if (!globalThis.__notifyMeChannels) {
    globalThis.__notifyMeChannels = {}
  }
  return globalThis.__notifyMeChannels
}

function replaceMemory(channels: ChannelMap) {
  globalThis.__notifyMeChannels = { ...channels }
}

function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export function getStoreBackend(): "upstash" | "jsonblob" | "memory" {
  if (getRedis()) return "upstash"
  if (process.env.NOTIFY_STORE_BACKEND === "memory") return "memory"
  return "jsonblob"
}

async function readAll(): Promise<ChannelMap> {
  const redis = getRedis()
  if (redis) {
    globalThis.__notifyMeStoreBackend = "upstash"
    const value = await redis.get<ChannelMap>("notify-me:channels")
    const channels = value ?? {}
    replaceMemory(channels)
    return channels
  }

  if (process.env.NOTIFY_STORE_BACKEND === "memory") {
    globalThis.__notifyMeStoreBackend = "memory"
    return { ...memoryStore() }
  }

  globalThis.__notifyMeStoreBackend = "jsonblob"
  try {
    const response = await fetch(JSONBLOB_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (response.status === 404) {
      await fetch(JSONBLOB_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ channels: {} }),
      })
      replaceMemory({})
      return {}
    }
    if (!response.ok) {
      return { ...memoryStore() }
    }
    const data = (await response.json()) as { channels?: ChannelMap }
    const channels = data.channels ?? {}
    replaceMemory(channels)
    return channels
  } catch {
    return { ...memoryStore() }
  }
}

async function writeAll(channels: ChannelMap): Promise<void> {
  replaceMemory(channels)

  const redis = getRedis()
  if (redis) {
    await redis.set("notify-me:channels", channels)
    return
  }

  if (process.env.NOTIFY_STORE_BACKEND === "memory") return

  try {
    await fetch(JSONBLOB_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ channels }),
    })
  } catch {
    // Memory copy remains as best effort for this isolate.
  }
}

export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidName(name: string): boolean {
  return name.length >= 3 && name.length <= 32 && NAME_RE.test(name)
}

export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function claimName(rawName: string): Promise<
  { ok: true; channel: Channel } | { ok: false; error: string; status: number }
> {
  const name = normalizeName(rawName)

  if (!isValidName(name)) {
    return {
      ok: false,
      error:
        "Name must be 3–32 characters: lowercase letters, numbers, and hyphens.",
      status: 400,
    }
  }

  const channels = await readAll()
  if (channels[name]) {
    return { ok: false, error: "That name is already taken.", status: 409 }
  }

  const channel: Channel = {
    name,
    apiKey: generateApiKey(),
    subscription: null,
    createdAt: Date.now(),
  }

  channels[name] = channel
  await writeAll(channels)
  return { ok: true, channel }
}

export async function ensureChannel(
  rawName: string,
  apiKey: string
): Promise<
  { ok: true; channel: Channel } | { ok: false; error: string; status: number }
> {
  const name = normalizeName(rawName)
  if (!isValidName(name) || !apiKey) {
    return { ok: false, error: "Invalid name or API key.", status: 400 }
  }

  const channels = await readAll()
  const existing = channels[name]
  if (existing) {
    if (existing.apiKey !== apiKey) {
      return { ok: false, error: "Invalid name or API key.", status: 401 }
    }
    return { ok: true, channel: existing }
  }

  const channel: Channel = {
    name,
    apiKey,
    subscription: null,
    createdAt: Date.now(),
  }
  channels[name] = channel
  await writeAll(channels)
  return { ok: true, channel }
}

export async function authenticateChannel(
  rawName: string,
  apiKey: string
): Promise<
  { ok: true; channel: Channel } | { ok: false; error: string; status: number }
> {
  const channel = await getChannel(rawName)
  if (!channel) {
    return { ok: false, error: "Channel not found.", status: 404 }
  }
  if (!apiKey || apiKey !== channel.apiKey) {
    return { ok: false, error: "Invalid name or API key.", status: 401 }
  }
  return { ok: true, channel }
}

export async function getChannel(
  rawName: string
): Promise<Channel | undefined> {
  const channels = await readAll()
  return channels[normalizeName(rawName)]
}

export async function setSubscription(
  rawName: string,
  subscription: PushSubscriptionJSON
): Promise<Channel | undefined> {
  const channels = await readAll()
  const name = normalizeName(rawName)
  const channel = channels[name]
  if (!channel) return undefined
  channel.subscription = subscription
  channels[name] = channel
  await writeAll(channels)
  return channel
}

export async function clearSubscription(rawName: string): Promise<void> {
  const channels = await readAll()
  const name = normalizeName(rawName)
  const channel = channels[name]
  if (!channel) return
  channel.subscription = null
  channels[name] = channel
  await writeAll(channels)
}

export function toPublicChannel(channel: Channel) {
  return {
    name: channel.name,
    connected: Boolean(channel.subscription),
    createdAt: channel.createdAt,
  }
}

export function buildConnectUrl(
  origin: string,
  name: string,
  apiKey: string
): string {
  const url = new URL(`/connect/${name}`, origin)
  url.searchParams.set("k", apiKey)
  return url.toString()
}
