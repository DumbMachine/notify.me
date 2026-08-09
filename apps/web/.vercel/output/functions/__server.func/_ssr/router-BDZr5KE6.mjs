import { r as __toESM } from "../_runtime.mjs";
import { c as lazyRouteComponent, i as HeadContent, l as createFileRoute, m as require_react, o as createRouter, p as require_jsx_runtime, r as Scripts, s as Outlet, u as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route$8 } from "../_name-B1fIya1c.mjs";
import { t as Route$9 } from "../_name-BigDvssI.mjs";
import { t as require_src } from "../_libs/web-push.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BDZr5KE6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_src = /* @__PURE__ */ __toESM(require_src());
var DirectionContext = /*#__PURE__*/ import_react.createContext(void 0);
/**
* Enables RTL behavior for Base UI components.
*
* Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
*/
var DirectionProvider = function DirectionProvider(props) {
	const { direction = "ltr" } = props;
	const contextValue = import_react.useMemo(() => ({ direction }), [direction]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(DirectionContext.Provider, {
		value: contextValue,
		children: props.children
	});
};
var globals_default = "/assets/globals-DVplp6Vn.css";
var SITE_NAME = "notify.me";
var Route$7 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: SITE_NAME },
			{
				name: "description",
				content: "Claim a name, connect your phone, and push notifications to it with a simple API."
			},
			{
				name: "theme-color",
				content: "#0f766e"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default"
			},
			{
				name: "apple-mobile-web-app-title",
				content: SITE_NAME
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: globals_default
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "icon",
				href: "/favicon.ico"
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png"
			}
		]
	}),
	component: RootComponent,
	notFoundComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-3 px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "404"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-semibold tracking-tight",
				children: "Page not found"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/",
				className: "text-sm text-primary underline-offset-4 hover:underline",
				children: "Back to notify.me"
			})
		]
	}),
	shellComponent: RootDocument
});
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DirectionProvider, {
		direction: "ltr",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		dir: "ltr",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-svh font-sans antialiased",
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
var channels = /* @__PURE__ */ new Map();
var NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
function normalizeName(raw) {
	return raw.trim().toLowerCase();
}
function isValidName(name) {
	return name.length >= 3 && name.length <= 32 && NAME_RE.test(name);
}
function generateApiKey() {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function claimName(rawName) {
	const name = normalizeName(rawName);
	if (!isValidName(name)) return {
		ok: false,
		error: "Name must be 3–32 characters: lowercase letters, numbers, and hyphens.",
		status: 400
	};
	if (channels.has(name)) return {
		ok: false,
		error: "That name is already taken.",
		status: 409
	};
	const channel = {
		name,
		apiKey: generateApiKey(),
		subscription: null,
		createdAt: Date.now()
	};
	channels.set(name, channel);
	return {
		ok: true,
		channel
	};
}
function getChannel(rawName) {
	return channels.get(normalizeName(rawName));
}
function setSubscription(rawName, subscription) {
	const channel = getChannel(rawName);
	if (!channel) return void 0;
	channel.subscription = subscription;
	return channel;
}
function clearSubscription(rawName) {
	const channel = getChannel(rawName);
	if (channel) channel.subscription = null;
}
function toPublicChannel(channel) {
	return {
		name: channel.name,
		connected: Boolean(channel.subscription),
		createdAt: channel.createdAt
	};
}
var Route$6 = createFileRoute("/manifest.webmanifest")({ server: { handlers: { GET: async ({ request }) => {
	const rawName = new URL(request.url).searchParams.get("name");
	const name = rawName ? normalizeName(rawName) : null;
	const channel = name ? getChannel(name) : void 0;
	const startUrl = channel ? `/connect/${channel.name}` : "/";
	const manifest = {
		id: startUrl,
		name: channel ? `notify.me/${channel.name}` : "notify.me",
		short_name: channel ? channel.name : "notify.me",
		description: channel ? `Push notifications for ${channel.name}` : "Claim a name and push notifications to your phone.",
		start_url: startUrl,
		scope: "/",
		display: "standalone",
		orientation: "portrait-primary",
		theme_color: "#0f766e",
		background_color: "#f7fbfa",
		icons: [
			{
				src: "/logo192.png",
				type: "image/png",
				sizes: "192x192",
				purpose: "any"
			},
			{
				src: "/logo512.png",
				type: "image/png",
				sizes: "512x512",
				purpose: "any"
			},
			{
				src: "/logo512.png",
				type: "image/png",
				sizes: "512x512",
				purpose: "maskable"
			}
		]
	};
	return new Response(JSON.stringify(manifest, null, 2), { headers: {
		"content-type": "application/manifest+json; charset=utf-8",
		"cache-control": "no-store"
	} });
} } } });
var $$splitComponentImporter = () => import("./routes-O-wyoxGl.mjs");
var Route$5 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var DEFAULT_VAPID_KEYS = {
	publicKey: "BBDCwLXT9M-U9D-bNl2yt5n0nB9fOg1NV4XOs0KJeiFCuL7wmgso8P1dq4gaGuOjq_-EvT-q7nP0XjjowWljBPo",
	privateKey: "faoVc5EDe8n-_W_RchKNU_vBInFgQHDR5aB-T9TLco8"
};
function createKeys() {
	if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return {
		publicKey: process.env.VAPID_PUBLIC_KEY,
		privateKey: process.env.VAPID_PRIVATE_KEY
	};
	return DEFAULT_VAPID_KEYS;
}
function getVapidKeys() {
	if (!globalThis.__notifyMeVapidKeys) globalThis.__notifyMeVapidKeys = createKeys();
	return globalThis.__notifyMeVapidKeys;
}
function configureWebPush() {
	const keys = getVapidKeys();
	import_src.default.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@notify.me", keys.publicKey, keys.privateKey);
	return keys;
}
var Route$4 = createFileRoute("/api/vapid-public-key")({ server: { handlers: { GET: async () => {
	const keys = configureWebPush();
	return Response.json({ publicKey: keys.publicKey });
} } } });
var Route$3 = createFileRoute("/api/claim")({ server: { handlers: { POST: async ({ request }) => {
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}
	const result = claimName(typeof body === "object" && body !== null && "name" in body && typeof body.name === "string" ? body.name : "");
	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	const origin = new URL(request.url).origin;
	return Response.json({
		...toPublicChannel(result.channel),
		apiKey: result.channel.apiKey,
		notifyUrl: `${origin}/api/notify/${result.channel.name}`,
		connectUrl: `${origin}/connect/${result.channel.name}`,
		dashboardUrl: `${origin}/${result.channel.name}`
	});
} } } });
async function sendPushToChannel(channel, payload) {
	if (!channel.subscription) return {
		ok: false,
		error: "No phone connected yet. Open the connect link on your phone first.",
		status: 404
	};
	configureWebPush();
	try {
		await import_src.default.sendNotification(channel.subscription, JSON.stringify({
			title: payload.title,
			body: payload.body ?? "",
			url: payload.url ?? `/connect/${channel.name}`,
			name: channel.name
		}));
		return { ok: true };
	} catch (error) {
		const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : void 0;
		if (statusCode === 404 || statusCode === 410) {
			clearSubscription(channel.name);
			return {
				ok: false,
				error: "Push subscription expired. Reconnect your phone.",
				status: 410
			};
		}
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Failed to send notification",
			status: 502
		};
	}
}
function isPushSubscription(value) {
	if (typeof value !== "object" || value === null) return false;
	const sub = value;
	if (typeof sub.endpoint !== "string" || !sub.endpoint) return false;
	if (typeof sub.keys !== "object" || sub.keys === null) return false;
	const keys = sub.keys;
	return typeof keys.p256dh === "string" && typeof keys.auth === "string";
}
function getBearerToken(request) {
	const header = request.headers.get("authorization");
	if (!header) return null;
	const [scheme, token] = header.split(" ");
	if (scheme?.toLowerCase() !== "bearer" || !token) return null;
	return token;
}
var Route$2 = createFileRoute("/api/notify/$name")({ server: { handlers: { POST: async ({ request, params }) => {
	const channel = getChannel(params.name);
	if (!channel) return Response.json({ error: "Channel not found." }, { status: 404 });
	const token = getBearerToken(request);
	if (!token || token !== channel.apiKey) return Response.json({ error: "Unauthorized." }, { status: 401 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}
	const title = typeof body === "object" && body !== null && "title" in body && typeof body.title === "string" ? body.title.trim() : "";
	if (!title) return Response.json({ error: "Field `title` is required." }, { status: 400 });
	const result = await sendPushToChannel(channel, {
		title,
		body: typeof body === "object" && body !== null && "body" in body && typeof body.body === "string" ? body.body : void 0,
		url: typeof body === "object" && body !== null && "url" in body && typeof body.url === "string" ? body.url : void 0
	});
	if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
	return Response.json({
		ok: true,
		delivered: true
	});
} } } });
var Route$1 = createFileRoute("/api/channel/$name")({ server: { handlers: { GET: async ({ params }) => {
	const channel = getChannel(params.name);
	if (!channel) return Response.json({ error: "Channel not found." }, { status: 404 });
	return Response.json(toPublicChannel(channel));
} } } });
var Route = createFileRoute("/api/channel/$name/subscribe")({ server: { handlers: { POST: async ({ request, params }) => {
	if (!getChannel(params.name)) return Response.json({ error: "Channel not found." }, { status: 404 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}
	if (!isPushSubscription(body)) return Response.json({ error: "Invalid push subscription." }, { status: 400 });
	const updated = setSubscription(params.name, body);
	if (!updated) return Response.json({ error: "Channel not found." }, { status: 404 });
	return Response.json(toPublicChannel(updated));
} } } });
var ManifestDotwebmanifestRoute = Route$6.update({
	id: "/manifest.webmanifest",
	path: "/manifest.webmanifest",
	getParentRoute: () => Route$7
});
var NameRoute = Route$8.update({
	id: "/$name",
	path: "/$name",
	getParentRoute: () => Route$7
});
var IndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$7
});
var ConnectNameRoute = Route$9.update({
	id: "/connect/$name",
	path: "/connect/$name",
	getParentRoute: () => Route$7
});
var ApiVapidPublicKeyRoute = Route$4.update({
	id: "/api/vapid-public-key",
	path: "/api/vapid-public-key",
	getParentRoute: () => Route$7
});
var ApiClaimRoute = Route$3.update({
	id: "/api/claim",
	path: "/api/claim",
	getParentRoute: () => Route$7
});
var ApiNotifyNameRoute = Route$2.update({
	id: "/api/notify/$name",
	path: "/api/notify/$name",
	getParentRoute: () => Route$7
});
var ApiChannelNameRoute = Route$1.update({
	id: "/api/channel/$name",
	path: "/api/channel/$name",
	getParentRoute: () => Route$7
});
var ApiChannelNameRouteChildren = { ApiChannelNameSubscribeRoute: Route.update({
	id: "/subscribe",
	path: "/subscribe",
	getParentRoute: () => ApiChannelNameRoute
}) };
var rootRouteChildren = {
	IndexRoute,
	NameRoute,
	ManifestDotwebmanifestRoute,
	ApiClaimRoute,
	ApiVapidPublicKeyRoute,
	ConnectNameRoute,
	ApiChannelNameRoute: ApiChannelNameRoute._addFileChildren(ApiChannelNameRouteChildren),
	ApiNotifyNameRoute
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
}
//#endregion
export { getRouter };
