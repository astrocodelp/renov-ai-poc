import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, Loader2, ArrowLeft } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
	component: SignupRouteComponent,
});

function SignupRouteComponent() {
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

	useEffect(() => {
		if (session?.user) {
			navigate({ to: "/dashboard" });
		}
	}, [navigate, session?.user]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setLoading(true);
		try {
			await authClient.signUp.email(
				{
					name: `${form.firstName} ${form.lastName}`.trim() || form.email,
					email: form.email,
					password: form.password,
					callbackURL: "/dashboard",
				},
				{
					onError(ctx) {
						setError(ctx.error.message);
					},
				},
			);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Something went wrong during sign up.";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleSocialLogin = async (provider: "github" | "google") => {
		setError(null);
		setLoadingProvider(provider);
		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: "/dashboard",
				errorCallbackURL: "/signup",
			});

			const url =
				(result as { url?: string } | undefined)?.url ??
				(result as { data?: { url?: string } } | undefined)?.data?.url;

			if (url) {
				window.location.href = url;
				return;
			}
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to start the social sign-in flow.";
			setError(message);
		} finally {
			setLoadingProvider(null);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-background via-muted/40 to-background text-foreground flex items-center justify-center px-6 py-12">
			<div className="w-full max-w-2xl rounded-2xl border border-border bg-card/80 shadow-2xl shadow-primary/20 backdrop-blur">
				<div className="grid md:grid-cols-2 gap-8 p-8">
					<div className="flex flex-col gap-4">
						<Link
							to="/"
							className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline w-fit"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to home
						</Link>
						<span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
							Create your account
						</span>
						<h1 className="text-3xl font-bold leading-tight font-display">
							Join Rennov.ai
						</h1>
						<p className="text-muted-foreground">
							Google provider verification is still pending. Please use GitHub
							or email/password to get started.
						</p>
						<div className="h-px w-16 bg-primary/60" />
					</div>

					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="firstName">First name</Label>
							<Input
								id="firstName"
								name="firstName"
								placeholder="Ada"
								autoComplete="given-name"
								value={form.firstName}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, firstName: e.target.value }))
								}
								disabled={loading}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="lastName">Last name</Label>
							<Input
								id="lastName"
								name="lastName"
								placeholder="Lovelace"
								autoComplete="family-name"
								value={form.lastName}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, lastName: e.target.value }))
								}
								disabled={loading}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="you@example.com"
								autoComplete="email"
								value={form.email}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, email: e.target.value }))
								}
								disabled={loading}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="••••••••"
								autoComplete="new-password"
								value={form.password}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, password: e.target.value }))
								}
								disabled={loading}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="confirmPassword">Confirm password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								placeholder="••••••••"
								autoComplete="new-password"
								value={form.confirmPassword}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										confirmPassword: e.target.value,
									}))
								}
								disabled={loading}
								required
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								"Sign up with email"
							)}
						</button>

						<div className="my-4 h-px w-full bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

						<div className="flex flex-col space-y-3">
							<button
								type="button"
								onClick={() => {
									console.log("GitHub signup clicked");
									handleSocialLogin("github");
								}}
								className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-card hover:bg-muted px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-60 disabled:cursor-not-allowed"
							>
								{loadingProvider === "github" ? (
									<Loader2 className="h-5 w-5 animate-spin" />
								) : (
									<Github className="h-5 w-5" />
								)}
								Continue with GitHub
							</button>
							<button
								type="button"
								onClick={() => handleSocialLogin("google")}
								className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold"
								title="Google verification pending"
							>
								<svg
									className="h-5 w-5"
									viewBox="0 0 256 262"
									xmlns="http://www.w3.org/2000/svg"
								>
									<title>Google logo</title>
									<path
										d="M255.68 133.47c0-10.57-.86-18.29-2.73-26.24H130.55v47.59h71.98c-1.45 12.09-9.32 30.27-26.79 42.48l-.24 1.63 38.91 30.17 2.69.27c24.73-22.8 38.58-56.33 38.58-96.9"
										fill="#4285F4"
									/>
									<path
										d="M130.55 261.1c35.15 0 64.72-11.62 86.29-31.64l-41.09-31.82c-11.02 7.71-25.82 13.1-45.2 13.1-34.52 0-63.8-22.8-74.23-54.36l-1.53.13-40.23 31.17-.53 1.49C35.87 231.99 79.73 261.1 130.55 261.1"
										fill="#34A853"
									/>
									<path
										d="M56.32 156.38c-2.78-8.08-4.38-16.7-4.38-25.58 0-8.88 1.6-17.5 4.22-25.58l-.07-1.71-40.73-31.64-1.33.63C4.9 91.26 0 110.18 0 130.8c0 20.62 4.9 39.54 13.96 57.3z"
										fill="#FBBC05"
									/>
									<path
										d="M130.55 50.95c24.45 0 40.93 10.57 50.3 19.39l36.7-35.9C195.15 12.35 165.7 0 130.55 0 79.73 0 35.87 29.11 13.96 73.5l40.21 31.71c10.6-31.56 39.88-54.26 74.38-54.26"
										fill="#EB4335"
									/>
								</svg>
								Google (pending verification)
							</button>
						</div>

						{error ? (
							<div className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
								{error}
							</div>
						) : null}

						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								to="/login"
								className="text-primary hover:underline font-semibold"
							>
								Log in
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
