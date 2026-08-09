//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-snzLM0tw.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/apps/web/src/routes/__root.tsx",
		children: [
			"/",
			"/$name",
			"/manifest.webmanifest",
			"/api/claim",
			"/api/vapid-public-key",
			"/connect/$name",
			"/api/channel/$name",
			"/api/notify/$name"
		],
		preloads: ["/assets/index-arz9xF3w.js", "/assets/useNavigate-CO1P81W1.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-arz9xF3w.js"
		} }]
	},
	"/": {
		filePath: "/workspace/apps/web/src/routes/index.tsx",
		children: void 0,
		preloads: ["/assets/routes-BBjadvhO.js", "/assets/button-BqqFSiud.js"]
	},
	"/$name": {
		filePath: "/workspace/apps/web/src/routes/$name.tsx",
		children: void 0,
		preloads: [
			"/assets/_name-gadH9nLp.js",
			"/assets/button-BqqFSiud.js",
			"/assets/badge-BDnwiFCm.js"
		]
	},
	"/connect/$name": {
		filePath: "/workspace/apps/web/src/routes/connect/$name.tsx",
		children: void 0,
		preloads: [
			"/assets/_name-DBef0598.js",
			"/assets/button-BqqFSiud.js",
			"/assets/badge-BDnwiFCm.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
