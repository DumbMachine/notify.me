import webpush from "web-push"

export type VapidKeys = {
  publicKey: string
  privateKey: string
}

declare global {
  // eslint-disable-next-line no-var
  var __notifyMeVapidKeys: VapidKeys | undefined
}

function createKeys(): VapidKeys {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    }
  }

  return webpush.generateVAPIDKeys()
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
