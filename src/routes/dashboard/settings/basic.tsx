import { createFileRoute } from "@tanstack/react-router";

import { OpenRouterKeyForm } from "@/components/ui/openrouter-key-form";

export const Route = createFileRoute("/dashboard/settings/basic")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto flex max-w-xl flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
			<div className="space-y-1">
				<h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
					Settings
				</h1>
				<p className="text-sm text-neutral-600 dark:text-neutral-400">
					Store your OpenRouter API key. It is kept only in a secure, same-site
					cookie with a 7-day expiry.
				</p>
			</div>

			<OpenRouterKeyForm />
		</div>
	);
}
