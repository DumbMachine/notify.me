const CREDS_PREFIX = "notify.me:creds:"
const DEVICE_KEY = "notify.me:device"
const LAST_NAME_KEY = "notify.me:last-name"
const DEVICE_CHANNEL_PREFIX = "notify.me:device-channel:"
const COOKIE_PREFIX = "notify_me_k_"

export type StoredCreds = {
  apiKey: string
  notifyUrl: string
  connectUrl: string
}

export type DeviceChannel = {
  apiKey: string
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function cookieName(name: string) {
  return `${COOKIE_PREFIX}${name}`
}

function readCookie(name: string): string | null {
  if (!canUseStorage()) return null
  const key = `${cookieName(name)}=`
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(key))
  if (!match) return null
  try {
    return decodeURIComponent(match.slice(key.length)) || null
  } catch {
    return null
  }
}

function writeCookie(name: string, apiKey: string) {
  if (!canUseStorage()) return
  const maxAge = 60 * 60 * 24 * 400
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${cookieName(name)}=${encodeURIComponent(apiKey)}; Path=/connect/${encodeURIComponent(name)}; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function saveCreds(name: string, creds: StoredCreds) {
  if (!canUseStorage()) return
  const payload = JSON.stringify(creds)
  localStorage.setItem(`${CREDS_PREFIX}${name}`, payload)
  sessionStorage.setItem(`notify.me:${name}`, payload)
  localStorage.setItem(LAST_NAME_KEY, name)
  saveDeviceChannel(name, { apiKey: creds.apiKey })
}

export function loadCreds(name: string): StoredCreds | null {
  if (!canUseStorage()) return null
  try {
    const raw =
      localStorage.getItem(`${CREDS_PREFIX}${name}`) ??
      sessionStorage.getItem(`notify.me:${name}`)
    if (!raw) return null
    return JSON.parse(raw) as StoredCreds
  } catch {
    return null
  }
}

export function saveDeviceChannel(name: string, channel: DeviceChannel) {
  if (!canUseStorage()) return
  localStorage.setItem(
    `${DEVICE_CHANNEL_PREFIX}${name}`,
    JSON.stringify(channel)
  )
  localStorage.setItem(DEVICE_KEY, name)
  localStorage.setItem(LAST_NAME_KEY, name)
  writeCookie(name, channel.apiKey)
}

export function loadDeviceChannel(name: string): DeviceChannel | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(`${DEVICE_CHANNEL_PREFIX}${name}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DeviceChannel
    if (!parsed?.apiKey) return null
    return parsed
  } catch {
    return null
  }
}

export function resolveDeviceApiKey(name: string, fromUrl?: string | null) {
  if (fromUrl) return fromUrl
  return (
    loadDeviceChannel(name)?.apiKey ??
    loadCreds(name)?.apiKey ??
    readCookie(name) ??
    null
  )
}

export function bindDevice(name: string) {
  if (!canUseStorage()) return
  localStorage.setItem(DEVICE_KEY, name)
  localStorage.setItem(LAST_NAME_KEY, name)
}

export function getBoundDevice(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(DEVICE_KEY)
}

export function getLastName(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(LAST_NAME_KEY)
}

export function clearBoundDevice() {
  if (!canUseStorage()) return
  localStorage.removeItem(DEVICE_KEY)
}

/** Manifest blob URL so Home Screen start_url keeps ?k= across installs. */
export function buildConnectManifestUrl(name: string, apiKey: string) {
  const origin = window.location.origin
  const path = `/connect/${encodeURIComponent(name)}/`
  const startUrl = `${path}?k=${encodeURIComponent(apiKey)}`
  const manifest = {
    id: startUrl,
    name: "Notify.me",
    short_name: "Notify.me",
    description: `Push notifications for ${name}`,
    start_url: startUrl,
    scope: path,
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#000000",
    background_color: "#000000",
    icons: [
      {
        src: `${origin}/icon.svg`,
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: `${origin}/logo192.png`,
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: `${origin}/logo512.png`,
        type: "image/png",
        sizes: "512x512",
        purpose: "any maskable",
      },
    ],
  }
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  })
  return URL.createObjectURL(blob)
}
