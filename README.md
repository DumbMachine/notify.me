# notify.me

Claim a name, connect your phone as a PWA, and send yourself push notifications with a simple API.

## Quick start

```bash
pnpm install
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Claim a unique name on the home page.
2. Scan the QR code (or open the connect link) on your phone.
3. Add **notify.me** to your Home Screen and enable notifications.
4. POST to your notify endpoint with the API key.

## API

### Claim a name

```bash
curl -X POST http://localhost:3000/api/claim \
  -H 'Content-Type: application/json' \
  -d '{"name":"alex"}'
```

### Send a notification

```bash
curl -X POST http://localhost:3000/api/notify/alex \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","body":"From your API"}'
```

Storage is **in-memory** for now — names and subscriptions reset when the server restarts.

## Notes

- Push requires HTTPS (or `localhost`).
- Optional env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Monorepo template: TanStack Start + shadcn/ui (`apps/web`, `packages/ui`).
