import webpush from "web-push"

import {
  appendNotification,
  clearSubscription,
  createNotificationId,
  type Channel,
  type NotificationEntry,
  type PushSubscriptionJSON,
} from "@/lib/store"
import type { RichNotifyInput } from "@/lib/notify-payload"
import { configureWebPush } from "@/lib/vapid"

export type NotifyPayload = RichNotifyInput

export type NotifyResult =
  | {
      ok: true
      delivered: boolean
      notification: NotificationEntry
    }
  | { ok: false; error: string; status: number }

function lockScreenPath(name: string, notificationId: string) {
  return `/connect/${encodeURIComponent(name)}?n=${encodeURIComponent(notificationId)}`
}

export async function sendPushToChannel(
  channel: Channel,
  payload: NotifyPayload
): Promise<NotifyResult> {
  const notificationId = createNotificationId()
  const body = payload.body ?? ""
  const createdAt = Date.now()
  const inboxUrl = lockScreenPath(channel.name, notificationId)

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
          // Always open the installed lock-screen inbox on tap.
          url: inboxUrl,
          link: payload.url,
          name: channel.name,
          createdAt,
          imageUrl: payload.imageUrl,
          mediaUrl: payload.mediaUrl,
          mediaType: payload.mediaType,
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
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to send notification"
        const notification = await appendNotification(channel.name, {
          id: notificationId,
          title: payload.title,
          body,
          url: payload.url,
          imageUrl: payload.imageUrl,
          mediaUrl: payload.mediaUrl,
          mediaType: payload.mediaType,
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
    url: payload.url,
    imageUrl: payload.imageUrl,
    mediaUrl: payload.mediaUrl,
    mediaType: payload.mediaType,
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
