import { Link, useNavigate } from "@tanstack/react-router";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
	ChevronDown,
	ChevronRight,
	Database,
	Home,
	Menu,
	Network,
	SquareFunction,
	StickyNote,
	Webhook,
	X,
	LogOut,
	LogIn,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [groupedExpanded, setGroupedExpanded] = useState<
		Record<string, boolean>
	>({});
	const session = useStore(authClient.useSession);
	const navigate = useNavigate();

	const handleLogout = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	return (
		<>
			<header className="p-4 flex items-center gap-4 bg-gray-800 text-white shadow-lg">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<h1 className="text-xl font-semibold">
						<Link to="/">
							<img
								src="/logo_192.png"
								alt="Renov.ai logo"
								className="h-10 w-10 object-contain"
							/>
						</Link>
					</h1>
				</div>

				<div className="ml-auto flex items-center gap-3">
					{session.data ? (
						<>
							<div className="hidden sm:flex flex-col text-sm text-gray-300">
								<span className="font-semibold text-white">
									{session.data.user.name ??
										session.data.user.email ??
										"Signed in"}
								</span>
								<span className="text-xs text-gray-400">Authenticated</span>
							</div>
							<button
								onClick={handleLogout}
								className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700 transition-colors"
							>
								<LogOut size={16} />
								Sign out
							</button>
						</>
					) : (
						<Link
							to="/login"
							className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold hover:bg-cyan-700 transition-colors"
						>
							<LogIn size={16} />
							Sign in
						</Link>
					)}
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					{/* Demo Links Start */}

					<Link
						to="/demo/start/server-funcs"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<SquareFunction size={20} />
						<span className="font-medium">Start - Server Functions</span>
					</Link>

					<Link
						to="/demo/start/api-request"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Network size={20} />
						<span className="font-medium">Start - API Request</span>
					</Link>

					<div className="flex flex-row justify-between">
						<Link
							to="/demo/start/ssr"
							onClick={() => setIsOpen(false)}
							className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex-1 flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<StickyNote size={20} />
							<span className="font-medium">Start - SSR Demos</span>
						</Link>
						<button
							className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
							onClick={() =>
								setGroupedExpanded((prev) => ({
									...prev,
									StartSSRDemo: !prev.StartSSRDemo,
								}))
							}
						>
							{groupedExpanded.StartSSRDemo ? (
								<ChevronDown size={20} />
							) : (
								<ChevronRight size={20} />
							)}
						</button>
					</div>
					{groupedExpanded.StartSSRDemo && (
						<div className="flex flex-col ml-4">
							<Link
								to="/demo/start/ssr/spa-mode"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
								activeProps={{
									className:
										"flex items center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
								}}
							>
								<StickyNote size={20} />
								<span className="font-medium">SPA Mode</span>
							</Link>

							<Link
								to="/demo/start/ssr/full-ssr"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
								}}
							>
								<StickyNote size={20} />
								<span className="font-medium">Full SSR</span>
							</Link>

							<Link
								to="/demo/start/ssr/data-only"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
								}}
							>
								<StickyNote size={20} />
								<span className="font-medium">Data Only</span>
							</Link>
						</div>
					)}

					<Link
						to="/demo/prisma"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Database size={20} />
						<span className="font-medium">Prisma</span>
					</Link>

					<Link
						to="/demo/mcp-todos"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Webhook size={20} />
						<span className="font-medium">MCP</span>
					</Link>

					{/* Demo Links End */}
				</nav>
			</aside>
		</>
	);
}
