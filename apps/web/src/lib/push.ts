import webpush from "web-push"

import {
  clearSubscription,
  type Channel,
  type PushSubscriptionJSON,
} from "@/lib/store"
import { configureWebPush } from "@/lib/vapid"

export type NotifyPayload = {
  title: string
  body?: string
  url?: string
}

export async function sendPushToChannel(
  channel: Channel,
  payload: NotifyPayload
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!channel.subscription) {
    return {
      ok: false,
      error: "No phone connected yet. Open the connect link on your phone first.",
      status: 404,
    }
  }

  configureWebPush()

  try {
    await webpush.sendNotification(
      channel.subscription as webpush.PushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body ?? "",
        url: payload.url ?? `/connect/${channel.name}`,
        name: channel.name,
      })
    )
    return { ok: true }
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : undefined

    if (statusCode === 404 || statusCode === 410) {
      await clearSubscription(channel.name)
      return {
        ok: false,
        error: "Push subscription expired. Reconnect your phone.",
        status: 410,
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to send notification"
    return { ok: false, error: message, status: 502 }
  }
}

export function isPushSubscription(value: unknown): value is PushSubscriptionJSON {
  if (typeof value !== "object" || value === null) return false
  const sub = value as Record<string, unknown>
  if (typeof sub.endpoint !== "string" || !sub.endpoint) return false
  if (typeof sub.keys !== "object" || sub.keys === null) return false
  const keys = sub.keys as Record<string, unknown>
  return typeof keys.p256dh === "string" && typeof keys.auth === "string"
}
