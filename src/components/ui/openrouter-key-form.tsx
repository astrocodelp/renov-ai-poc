"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COOKIE_KEY = "OPENROUTER_API_KEY";
const COOKIE_EXPIRY_DAYS = 7;

export function OpenRouterKeyForm() {
	const [apiKey, setApiKey] = useState("");
	const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const existing = Cookies.get(COOKIE_KEY);
		if (existing) {
			setApiKey(existing);
		}
	}, []);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const value = apiKey.trim();
		if (!value) {
			setError("API key is required.");
			setStatus("error");
			return;
		}

		Cookies.set(COOKIE_KEY, value, {
			secure: true,
			sameSite: "strict",
			expires: COOKIE_EXPIRY_DAYS,
			path: "/",
		});

		setError(null);
		setStatus("saved");
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
				<p>
					Your OpenRouter API key is stored only in a secure, same-site cookie
					for one week and is never saved in our database.
				</p>
				<p>
					This key is required to access AI models. We provide a shared key with
					€10 of credits; once those are used, please add your own. Create an
					API key at{" "}
					<a
						className="underline text-blue-600 dark:text-blue-400"
						href="https://openrouter.ai"
						target="_blank"
						rel="noreferrer"
					>
						openrouter.ai
					</a>
					.
				</p>
			</div>

			<form className="space-y-4" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<Label htmlFor="openrouter-key">OPENROUTER_API_KEY</Label>
					<Input
						id="openrouter-key"
						name="openrouter-key"
						type="password"
						placeholder="sk-or-..."
						value={apiKey}
						onChange={(event) => setApiKey(event.target.value)}
						autoComplete="off"
						required
					/>
					<p className="text-xs text-neutral-500 dark:text-neutral-500">
						For security, keep this key private. Browser-set cookies cannot be
						HTTP-only.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Button type="submit">Save key</Button>
					{status === "saved" && (
						<span
							className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
							aria-live="polite"
						>
							Saved to secure cookie
						</span>
					)}
					{status === "error" && error ? (
						<span
							className="text-sm font-medium text-amber-600 dark:text-amber-400"
							aria-live="polite"
						>
							{error}
						</span>
					) : null}
				</div>
			</form>
		</div>
	);
}
