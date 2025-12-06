import {
	HeadContent,
	Link,
	Scripts,
	createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "MyWebSite",
			},
			{
				title: "Rennov.ai - Interior Design AI",
				description: "Rennov.ai for interior designers and architects",
				keywords:
					"Rennov.ai, POC, Renovation, AI, 3D, Walkthrough, Video, Presentation",
				author: "astrocode.tech",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-96x96.png",
				sizes: "96x96",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "shortcut icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),

	notFoundComponent: NotFound,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

export function NotFound() {
	return (
		<div className="min-h-screen gradient-hero text-foreground flex flex-col items-center justify-center gap-8 px-6">
			<div className="text-center space-y-3">
				<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
					404
				</p>
				<h1 className="text-4xl font-display font-semibold text-gradient">
					Page not found
				</h1>
				<p className="text-muted-foreground">
					The page you’re looking for doesn’t exist.
				</p>
			</div>
			<div className="flex gap-4">
				<Link
					to="/"
					className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary/90"
				>
					Go home
				</Link>
				<Link
					to="/login"
					className="rounded-lg border border-border bg-card text-foreground px-5 py-2.5 text-sm font-semibold shadow-md transition hover:-translate-y-0.5 hover:bg-muted hover:text-foreground"
				>
					Go to login
				</Link>
			</div>
		</div>
	);
}
