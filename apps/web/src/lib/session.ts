const CREDS_PREFIX = "notify.me:creds:"
const DEVICE_KEY = "notify.me:device"
const LAST_NAME_KEY = "notify.me:last-name"
const DEVICE_CHANNEL_PREFIX = "notify.me:device-channel:"

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
  return loadDeviceChannel(name)?.apiKey ?? loadCreds(name)?.apiKey ?? null
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
