import webpush from "web-push"

export type VapidKeys = {
  publicKey: string
  privateKey: string
}

declare global {
  // eslint-disable-next-line no-var
  var __notifyMeVapidKeys: VapidKeys | undefined
}

// Stable defaults so serverless cold starts keep the same applicationServerKey.
// Prefer VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in production.
const DEFAULT_VAPID_KEYS: VapidKeys = {
  publicKey:
    "BBDCwLXT9M-U9D-bNl2yt5n0nB9fOg1NV4XOs0KJeiFCuL7wmgso8P1dq4gaGuOjq_-EvT-q7nP0XjjowWljBPo",
  privateKey: "faoVc5EDe8n-_W_RchKNU_vBInFgQHDR5aB-T9TLco8",
}

function createKeys(): VapidKeys {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    }
  }

  return DEFAULT_VAPID_KEYS
}

export function getVapidKeys(): VapidKeys {
  if (!globalThis.__notifyMeVapidKeys) {
    globalThis.__notifyMeVapidKeys = createKeys()
  }
  return globalThis.__notifyMeVapidKeys
}

export function configureWebPush() {
  const keys = getVapidKeys()
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hello@notify.me",
    keys.publicKey,
    keys.privateKey
  )
  return keys
}
