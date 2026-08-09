const CREDS_PREFIX = "notify.me:creds:"
const DEVICE_KEY = "notify.me:device"
const LAST_NAME_KEY = "notify.me:last-name"

export type StoredCreds = {
  apiKey: string
  notifyUrl: string
  connectUrl: string
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
