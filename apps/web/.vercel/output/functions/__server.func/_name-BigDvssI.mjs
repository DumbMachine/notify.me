import { c as lazyRouteComponent, l as createFileRoute } from "./_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_name-BigDvssI.js
var $$splitComponentImporter = () => import("./_name-DpesiQHv.mjs");
var Route = createFileRoute("/connect/$name")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	head: ({ params }) => ({
		meta: [{ title: `Connect · ${params.name} · notify.me` }, {
			name: "apple-mobile-web-app-title",
			content: `notify.me/${params.name}`
		}],
		links: [{
			rel: "manifest",
			href: `/manifest.webmanifest?name=${encodeURIComponent(params.name)}`
		}]
	})
});
//#endregion
export { Route as t };
