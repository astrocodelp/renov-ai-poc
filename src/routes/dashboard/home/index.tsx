import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Route as DashboardRoute } from "../route";

// Dashboard home content; layout is provided by `_layout.tsx`
export const Route = createFileRoute("/dashboard/home/")({
	component: DashboardHome,
});

function DashboardHome() {
	const router = useRouter();
	// Access parent route loader data
	const parentData = DashboardRoute.useLoaderData();
	const projects = parentData?.projects ?? [];

	// When component mounts on client, invalidate to refetch with proper session
	useEffect(() => {
		if (typeof window !== "undefined" && projects.length === 0) {
			// Small delay to ensure session is loaded
			const timer = setTimeout(() => {
				router.invalidate();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [router, projects.length]);

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-sm text-muted-foreground">Dashboard</p>
						<h1 className="text-2xl font-semibold text-foreground">
							Welcome back!
						</h1>
						<p className="text-base text-muted-foreground mt-1">
							Let&apos;s create together your next project.
						</p>
					</div>
					<Link to={"/dashboard/projects/new" as any}>
						<Button className="gap-2">
							<Plus className="size-4" />
							New project
						</Button>
					</Link>
				</div>
			</div>

			{projects.length > 0 ? (
				<div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Projects</p>
							<h2 className="text-lg font-semibold text-foreground">
								Recent projects
							</h2>
						</div>
						<Link to={"/dashboard/projects/new" as any}>
							<Button variant="outline" size="sm" className="gap-2">
								<Plus className="size-4" />
								Add project
							</Button>
						</Link>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<Link
								key={project.id}
								to="/dashboard/projects/$id"
								params={{ id: project.id }}
								className="rounded-xl border border-border bg-background p-4 shadow-xs hover:shadow-sm transition-shadow"
							>
								<p className="text-sm text-muted-foreground">Updated</p>
								<p className="text-xs text-muted-foreground mb-2">
									{new Date(project.updatedAt).toLocaleString()}
								</p>
								<h3 className="text-base font-semibold text-foreground">
									{project.name}
								</h3>
								<p className="text-xs text-muted-foreground mt-1">
									{project.roomCount} room
									{project.roomCount === 1 ? "" : "s"}
								</p>
							</Link>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
					<p className="text-sm text-muted-foreground mb-4">
						No projects yet. Create your first project to get started!
					</p>
					<Link to="/dashboard/projects/new">
						<Button className="gap-2">
							<Plus className="size-4" />
							Create your first project
						</Button>
					</Link>
				</div>
			)}
		</div>
	);
}
