import { r as __toESM } from "./_runtime.mjs";
import { d as Link, m as require_react, p as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as cn, o as cva, t as Button } from "./_ssr/button-DOAT9Wzk.mjs";
import { t as Badge } from "./_ssr/badge-BjxnNvcD.mjs";
import { a as CircleCheck, n as Share, r as House, s as Bell } from "./_libs/lucide-react.mjs";
import { t as Route } from "./_name-BigDvssI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_name-DpesiQHv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var alertVariants = cva("group/alert relative grid w-full gap-0.5 rounded-none border px-2.5 py-2 text-start text-xs has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4", {
	variants: { variant: {
		default: "bg-card text-card-foreground",
		destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
	} },
	defaultVariants: { variant: "default" }
});
function Alert({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "alert",
		role: "alert",
		className: cn(alertVariants({ variant }), className),
		...props
	});
}
function AlertTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "alert-title",
		className: cn("font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground", className),
		...props
	});
}
function AlertDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "alert-description",
		className: cn("text-xs/relaxed text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-2", className),
		...props
	});
}
function urlBase64ToUint8Array(base64String) {
	const base64 = (base64String + "=".repeat((4 - base64String.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
	return outputArray;
}
function getInstallHint() {
	if (typeof navigator === "undefined") return {
		platform: "unknown",
		title: "Add to Home Screen",
		steps: [
			"Open this page in your phone browser",
			"Use Share / menu → Add to Home Screen",
			"Open notify.me from your home screen"
		]
	};
	const ua = navigator.userAgent;
	const isIOS = /iPad|iPhone|iPod/.test(ua);
	const isAndroid = /Android/.test(ua);
	if (isIOS) return {
		platform: "ios",
		title: "Add to Home Screen (iPhone)",
		steps: [
			"Tap the Share button in Safari",
			"Scroll and tap Add to Home Screen",
			"Open notify.me from your home screen, then enable notifications"
		]
	};
	if (isAndroid) return {
		platform: "android",
		title: "Install app (Android)",
		steps: [
			"Tap the browser menu (⋮)",
			"Choose Install app or Add to Home screen",
			"Open notify.me from your home screen, then enable notifications"
		]
	};
	return {
		platform: "desktop",
		title: "Open on your phone",
		steps: [
			"Scan the QR from your dashboard on a phone",
			"Add this page to your home screen",
			"Enable notifications from the installed app"
		]
	};
}
function ConnectPage() {
	const { name } = Route.useParams();
	const [channelOk, setChannelOk] = (0, import_react.useState)(null);
	const [connected, setConnected] = (0, import_react.useState)(false);
	const [permission, setPermission] = (0, import_react.useState)(typeof Notification !== "undefined" ? Notification.permission : "default");
	const [step, setStep] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)(null);
	const [deferredPrompt, setDeferredPrompt] = (0, import_react.useState)(null);
	const [isStandalone, setIsStandalone] = (0, import_react.useState)(false);
	const hint = (0, import_react.useMemo)(() => getInstallHint(), []);
	(0, import_react.useEffect)(() => {
		const media = window.matchMedia("(display-mode: standalone)");
		const navStandalone = "standalone" in navigator && Boolean(navigator.standalone);
		setIsStandalone(media.matches || navStandalone);
		function onChange() {
			setIsStandalone(media.matches || navStandalone);
		}
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);
	(0, import_react.useEffect)(() => {
		function onBeforeInstall(event) {
			event.preventDefault();
			setDeferredPrompt(event);
		}
		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
	}, []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		fetch(`/api/channel/${name}`).then(async (response) => {
			if (!response.ok) {
				if (!cancelled) setChannelOk(false);
				return;
			}
			const data = await response.json();
			if (!cancelled) {
				setChannelOk(true);
				setConnected(data.connected);
			}
		}).catch(() => {
			if (!cancelled) setChannelOk(false);
		});
		return () => {
			cancelled = true;
		};
	}, [name]);
	async function enableNotifications() {
		setStep("working");
		setMessage(null);
		try {
			if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Push notifications are not supported in this browser. Try Chrome or Safari on a phone.");
			if (!window.isSecureContext) throw new Error("Notifications require HTTPS (or localhost). Open this page over a secure origin.");
			const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
			await navigator.serviceWorker.ready;
			const permissionResult = await Notification.requestPermission();
			setPermission(permissionResult);
			if (permissionResult !== "granted") throw new Error("Notification permission was not granted.");
			const vapid = await (await fetch("/api/vapid-public-key")).json();
			if (!vapid.publicKey) throw new Error("Could not load VAPID public key.");
			const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(vapid.publicKey)
			});
			const saveResponse = await fetch(`/api/channel/${name}/subscribe`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(subscription.toJSON())
			});
			if (!saveResponse.ok) {
				const data = await saveResponse.json();
				throw new Error(data.error ?? "Failed to save subscription.");
			}
			setConnected(true);
			setStep("done");
			setMessage("You're connected. Notifications will appear on this device.");
		} catch (error) {
			setStep("error");
			setMessage(error instanceof Error ? error.message : "Something went wrong.");
		}
	}
	if (channelOk === false) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-semibold tracking-tight",
				children: "Unknown name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-foreground",
					children: name
				}), " is not claimed on this server yet."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				nativeButton: false,
				render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/" }),
				children: "Claim a name"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-svh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": true,
			className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.93_0.05_170),_transparent_50%),linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.96_0.02_200))]"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "relative mx-auto flex min-h-svh w-full max-w-md flex-col px-6 py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "font-heading text-lg font-semibold tracking-tight",
						children: "notify.me"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: connected ? "default" : "secondary",
						children: connected ? "Connected" : "Setup"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Connecting"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-heading text-4xl font-semibold tracking-tight",
							children: name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted-foreground",
							children: "Save this page to your home screen, then enable notifications so your API can reach this phone."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border border-foreground/10 bg-background/70 p-4 backdrop-blur",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "size-4 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-heading text-sm font-medium",
										children: hint.title
									}),
									isStandalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "ms-auto size-4 text-primary" }) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-3 list-decimal space-y-1.5 ps-4 text-sm text-muted-foreground",
								children: hint.steps.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
							}),
							deferredPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								className: "mt-4 w-full",
								variant: "outline",
								onClick: () => void deferredPrompt.prompt(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, { "data-icon": "inline-start" }), "Install notify.me"]
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border border-foreground/10 bg-background/70 p-4 backdrop-blur",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-heading text-sm font-medium",
										children: "Enable notifications"
									}),
									permission === "granted" && connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "ms-auto size-4 text-primary" }) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "Allow alerts so POST requests to your notify endpoint can wake this device."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								className: "mt-4 w-full",
								onClick: () => void enableNotifications(),
								disabled: step === "working",
								children: step === "working" ? "Enabling…" : connected ? "Reconnect notifications" : "Enable notifications"
							})
						]
					})]
				}),
				message ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
					className: "mt-6",
					variant: step === "error" ? "destructive" : "default",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTitle, { children: step === "error" ? "Could not connect" : "Ready" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, { children: message })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-auto pt-10 text-center text-xs text-muted-foreground",
					children: "Keep this app installed. Closing the tab is fine after setup."
				})
			]
		})]
	});
}
//#endregion
export { ConnectPage as component };
