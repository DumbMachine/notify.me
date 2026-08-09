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

const channels = new Map<string, Channel>()

const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/

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

export function claimName(rawName: string):
  | { ok: true; channel: Channel }
  | { ok: false; error: string; status: number } {
  const name = normalizeName(rawName)

  if (!isValidName(name)) {
    return {
      ok: false,
      error:
        "Name must be 3–32 characters: lowercase letters, numbers, and hyphens.",
      status: 400,
    }
  }

  if (channels.has(name)) {
    return { ok: false, error: "That name is already taken.", status: 409 }
  }

  const channel: Channel = {
    name,
    apiKey: generateApiKey(),
    subscription: null,
    createdAt: Date.now(),
  }

  channels.set(name, channel)
  return { ok: true, channel }
}

export function getChannel(rawName: string): Channel | undefined {
  return channels.get(normalizeName(rawName))
}

export function setSubscription(
  rawName: string,
  subscription: PushSubscriptionJSON
): Channel | undefined {
  const channel = getChannel(rawName)
  if (!channel) return undefined
  channel.subscription = subscription
  return channel
}

export function clearSubscription(rawName: string): void {
  const channel = getChannel(rawName)
  if (channel) channel.subscription = null
}

export function authenticateChannel(
  rawName: string,
  apiKey: string
):
  | { ok: true; channel: Channel }
  | { ok: false; error: string; status: number } {
  const channel = getChannel(rawName)
  if (!channel) {
    return { ok: false, error: "Channel not found.", status: 404 }
  }
  if (!apiKey || apiKey !== channel.apiKey) {
    return { ok: false, error: "Invalid name or API key.", status: 401 }
  }
  return { ok: true, channel }
}

export function toPublicChannel(channel: Channel) {
  return {
    name: channel.name,
    connected: Boolean(channel.subscription),
    createdAt: channel.createdAt,
  }
}
