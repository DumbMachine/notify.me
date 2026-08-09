import webpush from "web-push"

import {
  appendNotification,
  clearSubscription,
  createNotificationId,
  type Channel,
  type NotificationEntry,
  type PushSubscriptionJSON,
} from "@/lib/store"
import { configureWebPush } from "@/lib/vapid"

export type NotifyPayload = {
  title: string
  body?: string
  url?: string
}

export type NotifyResult =
  | {
      ok: true
      delivered: boolean
      notification: NotificationEntry
    }
  | { ok: false; error: string; status: number }

export async function sendPushToChannel(
  channel: Channel,
  payload: NotifyPayload
): Promise<NotifyResult> {
  const notificationId = createNotificationId()
  const body = payload.body ?? ""
  const url = payload.url ?? `/connect/${channel.name}`
  const createdAt = Date.now()

  let delivered = false

  if (channel.subscription) {
    configureWebPush()
    try {
      await webpush.sendNotification(
        channel.subscription as webpush.PushSubscription,
        JSON.stringify({
          id: notificationId,
          title: payload.title,
          body,
          url,
          name: channel.name,
          createdAt,
        })
      )
      delivered = true
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
        // Still record history — lock screen remains the inbox.
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to send notification"
        // Persist history even when push transport fails this round.
        const notification = await appendNotification(channel.name, {
          id: notificationId,
          title: payload.title,
          body,
          url,
          createdAt,
          delivered: false,
        })
        if (!notification) {
          return { ok: false, error: message, status: 502 }
        }
        return {
          ok: true,
          delivered: false,
          notification,
        }
      }
    }
  }

  const notification = await appendNotification(channel.name, {
    id: notificationId,
    title: payload.title,
    body,
    url,
    createdAt,
    delivered,
  })

  if (!notification) {
    return { ok: false, error: "Channel not found.", status: 404 }
  }

  return { ok: true, delivered, notification }
}

export function isPushSubscription(value: unknown): value is PushSubscriptionJSON {
  if (typeof value !== "object" || value === null) return false
  const sub = value as Record<string, unknown>
  if (typeof sub.endpoint !== "string" || !sub.endpoint) return false
  if (typeof sub.keys !== "object" || sub.keys === null) return false
  const keys = sub.keys as Record<string, unknown>
  return typeof keys.p256dh === "string" && typeof keys.auth === "string"
}
