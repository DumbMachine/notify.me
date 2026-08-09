import { r as __toESM } from "./_runtime.mjs";
import { d as Link, m as require_react, p as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as Route } from "./_name-B1fIya1c.mjs";
import { a as cn, p as useRenderElement, t as Button } from "./_ssr/button-DOAT9Wzk.mjs";
import { t as Badge } from "./_ssr/badge-BjxnNvcD.mjs";
import { c as BellRing, i as Copy, o as Check, t as Smartphone } from "./_libs/lucide-react.mjs";
import { t as require_lib } from "./_libs/qrcode.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_name-CbODvOaT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_lib = /* @__PURE__ */ __toESM(require_lib());
function CopyButton({ value, label = "Copy", className }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	async function onCopy() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			setCopied(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant: "outline",
		size: "sm",
		className: cn(className),
		onClick: () => void onCopy(),
		children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { "data-icon": "inline-start" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { "data-icon": "inline-start" }), copied ? "Copied" : label]
	});
}
function QrCode({ value, className, size = 220 }) {
	const [dataUrl, setDataUrl] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		import_lib.toDataURL(value, {
			width: size,
			margin: 1,
			color: {
				dark: "#0f766e",
				light: "#ffffff"
			}
		}).then((url) => {
			if (!cancelled) setDataUrl(url);
		});
		return () => {
			cancelled = true;
		};
	}, [value, size]);
	if (!dataUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse bg-muted", className),
		style: {
			width: size,
			height: size
		},
		"aria-hidden": true
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: dataUrl,
		alt: "QR code",
		width: size,
		height: size,
		className: cn("bg-white p-2", className)
	});
}
/**
* A separator element accessible to screen readers.
* Renders a `<div>` element.
*
* Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
*/
var Separator$1 = /*#__PURE__*/ import_react.forwardRef(function SeparatorComponent(componentProps, forwardedRef) {
	const { className, render, orientation = "horizontal", style, ...elementProps } = componentProps;
	return useRenderElement("div", componentProps, {
		state: { orientation },
		ref: forwardedRef,
		props: [{
			role: "separator",
			"aria-orientation": orientation
		}, elementProps]
	});
});
function Separator({ className, orientation = "horizontal", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, {
		"data-slot": "separator",
		orientation,
		className: cn("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		"data-slot": "textarea",
		className: cn("flex field-sizing-content min-h-16 w-full rounded-none border border-input bg-transparent px-2.5 py-2 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	});
}
function loadCreds(name) {
	try {
		const raw = sessionStorage.getItem(`notify.me:${name}`);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function DashboardPage() {
	const { name } = Route.useParams();
	const [creds, setCreds] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [testTitle, setTestTitle] = (0, import_react.useState)("Hello from notify.me");
	const [testBody, setTestBody] = (0, import_react.useState)("Your phone is connected.");
	const [testResult, setTestResult] = (0, import_react.useState)(null);
	const [testing, setTesting] = (0, import_react.useState)(false);
	const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
	const connectUrl = (0, import_react.useMemo)(() => creds?.connectUrl ?? `${origin}/connect/${name}`, [
		creds,
		origin,
		name
	]);
	const notifyUrl = (0, import_react.useMemo)(() => creds?.notifyUrl ?? `${origin}/api/notify/${name}`, [
		creds,
		origin,
		name
	]);
	(0, import_react.useEffect)(() => {
		setCreds(loadCreds(name));
	}, [name]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		async function refresh() {
			try {
				const response = await fetch(`/api/channel/${name}`);
				const data = await response.json();
				if (!cancelled) if (response.ok) setStatus(data);
				else setStatus(null);
			} catch {
				if (!cancelled) setStatus(null);
			}
		}
		refresh();
		const id = window.setInterval(() => void refresh(), 3e3);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [name]);
	const curlExample = creds ? `curl -X POST '${notifyUrl}' \\\n  -H 'Authorization: Bearer ${creds.apiKey}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"title":"Hello","body":"From your API"}'` : `curl -X POST '${notifyUrl}' \\\n  -H 'Authorization: Bearer YOUR_API_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"title":"Hello","body":"From your API"}'`;
	async function sendTest() {
		if (!creds) {
			setTestResult("API key missing from this browser session. Claim the name again.");
			return;
		}
		setTesting(true);
		setTestResult(null);
		try {
			const response = await fetch(notifyUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${creds.apiKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					title: testTitle,
					body: testBody
				})
			});
			const data = await response.json();
			if (!response.ok) setTestResult(data.error ?? "Failed to send.");
			else setTestResult("Sent. Check your phone.");
		} catch {
			setTestResult("Network error while sending.");
		} finally {
			setTesting(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-svh",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_oklch(0.99_0.01_170),_oklch(0.97_0.015_200))]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "font-heading text-xl font-semibold tracking-tight text-foreground",
					children: "notify.me"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: status?.connected ? "default" : "secondary",
					children: status?.connected ? "Phone connected" : "Waiting for phone"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "animate-in fade-in slide-in-from-bottom-2 duration-500",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Your endpoint"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-heading text-4xl font-semibold tracking-tight sm:text-5xl",
							children: name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground",
							children: "Scan the QR code with your phone, install notify.me to the home screen, and allow notifications. Then POST to your API."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
										children: "Notify URL"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, { value: notifyUrl })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "block overflow-x-auto bg-foreground/5 px-3 py-2 text-xs",
									children: notifyUrl
								})] }),
								creds ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-2 flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
											children: "API key"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, { value: creds.apiKey })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "block overflow-x-auto bg-foreground/5 px-3 py-2 text-xs",
										children: creds.apiKey
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs text-muted-foreground",
										children: "Shown only in this browser session. Store it somewhere safe."
									})
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-amber-700 dark:text-amber-400",
									children: "API key is not in this session. If you just claimed this name on another device, reclaim it after a server restart, or keep this tab open after claiming."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
										children: "Example"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, {
										value: curlExample,
										label: "Copy curl"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "overflow-x-auto bg-foreground/5 px-3 py-3 text-xs leading-relaxed",
									children: curlExample
								})] })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-foreground/10 bg-background/80 p-6 backdrop-blur",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "mt-0.5 size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-heading text-lg font-medium",
									children: "Connect phone"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: "Open this link on your phone, then add to Home Screen."
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 flex justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {
									value: connectUrl,
									size: 200
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "min-w-0 flex-1 truncate bg-foreground/5 px-2 py-1.5 text-xs",
									children: connectUrl
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, {
									value: connectUrl,
									label: "Copy link"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-6" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { className: "mt-0.5 size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-heading text-lg font-medium",
											children: "Send a test"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted-foreground",
											children: "Once your phone is connected, try a notification from here."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													className: "h-9 w-full border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
													value: testTitle,
													onChange: (e) => setTestTitle(e.target.value),
													placeholder: "Title"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
													value: testBody,
													onChange: (e) => setTestBody(e.target.value),
													placeholder: "Body",
													rows: 3
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													onClick: () => void sendTest(),
													disabled: testing || !testTitle.trim(),
													className: "w-full",
													children: testing ? "Sending…" : "Send test notification"
												}),
												testResult ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													role: "status",
													children: testResult
												}) : null
											]
										})
									]
								})]
							})
						]
					})
				})]
			})
		]
	});
}
//#endregion
export { DashboardPage as component };
