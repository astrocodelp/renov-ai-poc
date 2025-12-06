import React from "react";
import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
	useRouter,
	redirect,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	ChevronDown,
	ChevronRight,
	FolderOpen,
	LayoutDashboard,
	Lock,
	LogOut,
	Plus,
	Shield,
	SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { authMiddleware } from "@/middleware/auth";

type Project = {
	id: string;
	name: string;
	roomCount: number;
	createdAt: string;
	updatedAt: string;
};

// Layout route for all /dashboard/* pages
export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
	loader: async (): Promise<{ projects: Project[] }> =>
		getProjects() as Promise<{ projects: Project[] }>,
	server: {
		middleware: [authMiddleware],
	},
	beforeLoad: ({ location }) => {
		const normalized = location.pathname.replace(/\/+$/, "");
		if (normalized === "/dashboard") {
			throw redirect({ to: "/dashboard/home", replace: true });
		}
		return undefined as never;
	},
});

function DashboardLayout() {
	const { projects } = Route.useLoaderData();
	const navigate = useNavigate();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const [isLoggingOut, setIsLoggingOut] = React.useState(false);
	const [sidebarOpen, setSidebarOpen] = React.useState(false);
	const [projectsOpen, setProjectsOpen] = React.useState(true);

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setSidebarOpen(true);
		}, 150);
		return () => clearTimeout(timer);
	}, []);

	const handleLogout = async () => {
		if (isLoggingOut) return;
		setIsLoggingOut(true);
		try {
			await authClient.signOut();
			await navigate({ to: "/login", replace: true, reloadDocument: true });
		} catch (error) {
			console.error("Error signing out", error);
			await router.invalidate();
			window.location.href = "/login";
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div className="min-h-screen flex bg-background">
			<aside
				onMouseEnter={() => setSidebarOpen(true)}
				onMouseLeave={() => setSidebarOpen(false)}
				className={cn(
					"group sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-[width] duration-300 shrink-0 overflow-hidden",
					sidebarOpen ? "w-72" : "w-20",
				)}
			>
				<div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border shrink-0">
					<Link to="/">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 p-1">
							<img
								src="/logo_192.png"
								alt="Rennov.ai logo"
								className="w-9 h-9 object-contain"
							/>
						</div>
					</Link>
					<div
						className={cn(
							"transition-opacity duration-200 whitespace-nowrap",
							sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
						)}
					>
						<p className="text-sm text-muted-foreground">Rennov.ai</p>
						<p className="text-lg font-semibold text-foreground">Workspace</p>
					</div>
				</div>

				<nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-2">
					<SidebarLink
						to="/dashboard/home"
						icon={<LayoutDashboard className="size-4 shrink-0" />}
						label="Dashboard"
						sidebarOpen={sidebarOpen}
					/>

					<Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
						<div
							className={cn(
								"flex items-center justify-between px-2",
								!sidebarOpen && "justify-center px-0",
							)}
						>
							<CollapsibleTrigger className="w-full">
								<div
									className={cn(
										"flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-colors",
										!sidebarOpen && "justify-center gap-0 px-0",
									)}
								>
									<FolderOpen className="size-4 shrink-0 text-primary" />
									{sidebarOpen && (
										<div className="flex flex-1 items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Projects
											</span>
											{projectsOpen ? (
												<ChevronDown className="size-4 text-muted-foreground" />
											) : (
												<ChevronRight className="size-4 text-muted-foreground" />
											)}
										</div>
									)}
								</div>
							</CollapsibleTrigger>
							{sidebarOpen && (
								<Link to="/dashboard/projects/new" className="ml-1 shrink-0">
									<Button
										size="icon-sm"
										variant="ghost"
										className="text-primary hover:text-primary-foreground hover:bg-primary/20"
										title="Add project"
									>
										<Plus className="size-4" />
									</Button>
								</Link>
							)}
						</div>
						{sidebarOpen ? (
							<CollapsibleContent className="px-2 pt-1 space-y-1 overflow-hidden">
								{projects.length === 0 ? (
									<div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar p-3 text-sm text-muted-foreground">
										No projects yet. Create your first one to get started.
										<div className="mt-3">
											<Link to="/dashboard/projects/new">
												<Button
													variant="outline"
													size="sm"
													className="w-full justify-center border-primary/30 text-foreground bg-primary/5 hover:bg-primary/15"
												>
													<Plus className="size-4" />
													Add project
												</Button>
											</Link>
										</div>
									</div>
								) : null}

								{projects.length > 0 ? (
									<div className="space-y-1">
										{projects.map((project: Project) => (
											<Link
												key={project.id}
												to="/dashboard/projects/$id"
												params={{ id: project.id }}
												className="block rounded-lg px-3 py-2 hover:bg-sidebar-accent/50 transition-colors"
												activeProps={{
													className: cn(
														"block rounded-lg px-3 py-2 bg-primary/15 border border-primary/40 text-foreground shadow-sm",
														"hover:bg-primary/20",
													),
												}}
												activeOptions={{ exact: false }}
											>
												<p className="text-sm font-medium text-foreground">
													{project.name}
												</p>
												<div className="text-xs text-muted-foreground flex items-center gap-2">
													<span className="rounded-full bg-primary/15 px-2 py-0.5 text-foreground">
														{project.roomCount} rooms
													</span>
													<span>
														Updated{" "}
														{new Date(project.updatedAt).toLocaleDateString()}
													</span>
												</div>
											</Link>
										))}
									</div>
								) : null}
							</CollapsibleContent>
						) : null}
					</Collapsible>

					<div className="pt-4">
						<p
							className={cn(
								"px-4 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-opacity duration-200",
								sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
							)}
						>
							Settings
						</p>
						<div className="mt-2 space-y-1">
							<SidebarLink
								to="/dashboard/settings/auth"
								icon={<Shield className="size-4 shrink-0" />}
								label="Auth"
								sidebarOpen={sidebarOpen}
							/>
							<SidebarLink
								to="/dashboard/settings/basic"
								icon={<SlidersHorizontal className="size-4 shrink-0" />}
								label="Settings"
								sidebarOpen={sidebarOpen}
							/>
						</div>
					</div>
				</nav>

				<div className="border-t border-sidebar-border px-3 py-4 shrink-0">
					<div
						className={cn(
							"flex items-center gap-3 rounded-lg px-2 py-2",
							!sidebarOpen && "justify-center px-0",
						)}
					>
						<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-border text-foreground">
							<Lock className="size-4 shrink-0" />
						</div>
						{sidebarOpen && (
							<div className="leading-tight overflow-hidden">
								<p className="text-sm font-semibold text-foreground truncate">
									{session?.user.name ?? session?.user.email ?? ""}
								</p>
								<p className="text-xs text-muted-foreground">Signed in</p>
							</div>
						)}
					</div>
					<Button
						onClick={handleLogout}
						disabled={isLoggingOut}
						variant="ghost"
						className={cn(
							"mt-3 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive",
							sidebarOpen ? "justify-start" : "justify-center px-0",
						)}
					>
						<LogOut className="size-4 shrink-0" />
						{sidebarOpen && <span>Logout</span>}
					</Button>
				</div>
			</aside>

			<main className="flex-1 p-8 h-screen overflow-y-auto">
				<Outlet />
			</main>
		</div>
	);
}

const getProjects = createServerFn({ method: "GET" }).handler(
	// @ts-expect-error server fn ctx typing friction
	async ({
		request,
	}: {
		request: Request;
	}): Promise<{ projects: Project[] }> => {
		const { auth } = await import("@/lib/auth.server");

		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session) {
			throw redirect({ to: "/login", replace: true });
		}

		const { prisma } = await import("@/db.server");

		const projectsRaw = await prisma.project.findMany({
			where: { ownerId: session.user.id },
			select: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
				rooms: { select: { id: true } },
			},
			orderBy: { updatedAt: "desc" },
		});

		return {
			projects: projectsRaw.map((p) => ({
				id: p.id,
				name: p.name,
				roomCount: p.rooms.length,
				createdAt: p.createdAt.toISOString(),
				updatedAt: p.updatedAt.toISOString(),
			})),
		};
	},
);

type SidebarLinkProps = {
	to: string;
	icon: React.ReactNode;
	label: string;
	sidebarOpen: boolean;
};

function SidebarLink({ to, icon, label, sidebarOpen }: SidebarLinkProps) {
	return (
		<Link
			to={to}
			className={cn(
				"group/link flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-sidebar-accent/50 transition-colors",
				!sidebarOpen && "justify-center px-0 gap-0",
			)}
			activeProps={{
				className: cn(
					"group/link flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/15 text-foreground border border-primary/40",
					!sidebarOpen && "justify-center px-0 gap-0",
				),
			}}
		>
			<span className="text-muted-foreground shrink-0 flex items-center justify-center">
				{icon}
			</span>
			<span
				className={cn(
					"text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
					sidebarOpen ? "opacity-100" : "hidden pointer-events-none",
				)}
			>
				{label}
			</span>
		</Link>
	);
}
