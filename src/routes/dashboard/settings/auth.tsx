import { useEffect, useEffectEvent, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	CheckCircle2,
	Globe,
	Github,
	Loader2,
	LogOut,
	RefreshCw,
	ShieldOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type SessionRecord = {
	id: string;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	ipAddress?: string | null;
	userAgent?: string | null;
};

type AccountRecord = {
	id: string;
	providerId: string;
	createdAt: string;
	updatedAt: string;
	scope?: string | null;
};

type AccountSummary = {
	user: {
		id: string;
		name: string | null;
		email: string;
		emailVerified: boolean;
		image?: string | null;
		createdAt: string;
		updatedAt: string;
	};
	sessions: SessionRecord[];
	accounts: AccountRecord[];
};

export const Route = createFileRoute("/dashboard/settings/auth")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const {
		data: session,
		isPending,
		refetch: refetchSession,
	} = authClient.useSession();

	const [profileName, setProfileName] = useState("");
	const [accountData, setAccountData] = useState<AccountSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [savingProfile, setSavingProfile] = useState(false);
	const [sessionAction, setSessionAction] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [deletingAccount, setDeletingAccount] = useState(false);

	type SessionShape = {
		session?: { id?: string | null } | null;
		sessionId?: string | null;
	};

	const currentSession = session as SessionShape | null;
	const currentSessionId =
		currentSession?.session?.id ?? currentSession?.sessionId ?? null;

	const hasProvider = (data: AccountSummary | null, provider: string) =>
		(data?.accounts ?? []).some((a) => a.providerId === provider);

	const hasPasswordAccount = (data: AccountSummary | null) =>
		(data?.accounts ?? []).some((a) =>
			[
				"email",
				"credentials",
				"password",
				"email-password",
				"credential",
			].includes(a.providerId),
		);

	type SessionStore = {
		refetch?: () => Promise<void>;
		data?: { user?: Partial<AccountSummary["user"]> } | null;
	} | null;

	type SessionAtom = {
		get?: () => SessionStore;
		set?: (value: SessionStore) => void;
	};

	type SessionSignal = { get?: () => boolean; set?: (value: boolean) => void };

	const refreshAuthSession = async () => {
		// Prefer the official Better Auth refetch first so all subscribers update
		if (typeof refetchSession === "function") {
			await refetchSession();
		}

		const sessionAtom = (authClient as { session?: SessionAtom }).session;
		const refetch = sessionAtom?.get?.()?.refetch;
		if (typeof refetch === "function") {
			await refetch();
			return;
		}

		const useSessionAtom = authClient.useSession as unknown as SessionAtom;
		const refetchUseSession = useSessionAtom?.get?.()?.refetch;
		if (typeof refetchUseSession === "function") {
			await refetchUseSession();
			return;
		}

		const signal = (authClient as { $sessionSignal?: SessionSignal })
			?.$sessionSignal;
		if (signal?.get && signal?.set) {
			signal.set(!signal.get());
		}
	};

	const updateLocalSessionUser = (
		nextUser: Partial<AccountSummary["user"]>,
	) => {
		const sessionAtom = (authClient as { session?: SessionAtom }).session;
		const current: SessionStore = sessionAtom?.get?.() ?? null;

		if (current && sessionAtom?.set) {
			sessionAtom.set({
				...current,
				data: current.data
					? {
							...current.data,
							user: {
								...current.data.user,
								...nextUser,
							},
						}
					: current.data,
			});
		}
	};

	const loadAccountData = useEffectEvent(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/settings/account", {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				throw new Error("Unable to load account settings");
			}

			const data = (await res.json()) as AccountSummary;
			setAccountData(data);
			setProfileName(data.user.name ?? "");
			updateLocalSessionUser({ name: data.user.name, email: data.user.email });
			await refreshAuthSession();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load settings");
		} finally {
			setLoading(false);
		}
	});

	useEffect(() => {
		if (isPending) return;
		void loadAccountData();
	}, [isPending]);

	const handleProfileSave = async () => {
		if (!profileName.trim()) {
			setError("Name is required");
			return;
		}

		setSavingProfile(true);
		setError(null);
		setSuccess(null);

		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "update-profile", name: profileName }),
			});

			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? "Unable to save profile");
			}

			setSuccess("Profile updated");
			updateLocalSessionUser({ name: profileName.trim() });
			await refreshAuthSession();
			await loadAccountData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to save profile");
		} finally {
			setSavingProfile(false);
		}
	};

	const revokeSession = async (sessionId: string) => {
		setSessionAction(sessionId);
		setError(null);
		setSuccess(null);
		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "revoke-session", sessionId }),
			});

			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? "Unable to revoke session");
			}

			if (sessionId === currentSessionId) {
				await refreshAuthSession();
				await authClient.signOut();
				await navigate({ to: "/login", replace: true, reloadDocument: true });
				return;
			}

			setSuccess("Session revoked");
			await refreshAuthSession();
			await loadAccountData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to revoke session");
		} finally {
			setSessionAction(null);
		}
	};

	const revokeOtherSessions = async () => {
		setSessionAction("others");
		setError(null);
		setSuccess(null);
		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					action: "revoke-other-sessions",
					currentSessionId,
				}),
			});

			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? "Unable to revoke other sessions");
			}

			setSuccess("Other sessions revoked");
			await refreshAuthSession();
			await loadAccountData();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to revoke other sessions",
			);
		} finally {
			setSessionAction(null);
		}
	};

	const revokeAllSessions = async () => {
		setSessionAction("all");
		setError(null);
		setSuccess(null);
		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "revoke-all-sessions" }),
			});

			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? "Unable to revoke sessions");
			}

			await refreshAuthSession();
			await authClient.signOut();
			await navigate({ to: "/login", replace: true, reloadDocument: true });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to revoke all sessions",
			);
		} finally {
			setSessionAction(null);
		}
	};

	const declineSso = async () => {
		setSessionAction("decline-sso");
		setError(null);
		setSuccess(null);
		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "decline-sso" }),
			});

			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? "Unable to disconnect SSO");
			}

			await refreshAuthSession();
			await authClient.signOut();
			await navigate({ to: "/login", replace: true, reloadDocument: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to disconnect SSO");
		} finally {
			setSessionAction(null);
		}
	};

	const handleLinkSocial = async (provider: "github" | "google") => {
		setError(null);
		setSuccess(null);
		setLinkingProvider(provider);
		try {
			if (provider === "google") {
				throw new Error("Google linking is pending verification");
			}

			await authClient.linkSocial({
				provider,
				callbackURL: "/dashboard/settings/auth",
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to link provider");
		} finally {
			setLinkingProvider(null);
		}
	};

	const handleSetOrChangePassword = async (mode: "set" | "change") => {
		setError(null);
		setSuccess(null);

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (mode === "change" && !currentPassword) {
			setError("Current password is required");
			return;
		}

		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify(
					mode === "set"
						? { action: "set-password", newPassword }
						: { action: "change-password", currentPassword, newPassword },
				),
			});

			const body = (await res.json().catch(() => ({}))) as { error?: string };
			if (!res.ok) {
				throw new Error(body.error ?? "Unable to update password");
			}

			setSuccess(
				mode === "set" ? "Password set successfully" : "Password changed",
			);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			await refreshAuthSession();
			await loadAccountData();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to update password",
			);
		}
	};

	const handleDeleteAccount = async () => {
		const confirmation = deleteConfirmation.trim().toLowerCase();

		if (confirmation !== "confirm") {
			setError('Type "confirm" to delete your account');
			return;
		}

		setDeletingAccount(true);
		setError(null);
		setSuccess(null);

		try {
			const res = await fetch("/api/settings/account", {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					action: "delete-account",
					confirmation: deleteConfirmation,
				}),
			});

			const body = (await res.json().catch(() => ({}))) as { error?: string };
			if (!res.ok) {
				throw new Error(body.error ?? "Unable to delete account");
			}

			await refreshAuthSession();
			await authClient.signOut();
			await navigate({ to: "/login", replace: true, reloadDocument: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to delete account");
		} finally {
			setDeletingAccount(false);
		}
	};

	const renderSessions = () => {
		if (!accountData?.sessions?.length) {
			return (
				<div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
					No active sessions found.
				</div>
			);
		}

		return (
			<div className="space-y-3">
				{accountData.sessions.map((s) => {
					const isCurrent = s.id === currentSessionId;
					const created = new Date(s.createdAt).toLocaleString();
					const expires = new Date(s.expiresAt).toLocaleString();

					return (
						<div
							key={s.id}
							className="flex flex-col gap-3 rounded-lg border border-border bg-card/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
						>
							<div className="space-y-1 text-sm">
								<div className="flex items-center gap-2 font-semibold text-foreground">
									{isCurrent ? "Current session" : "Session"}
									<span className="text-[11px] uppercase tracking-wide text-muted-foreground">
										{s.id.slice(0, 8)}
									</span>
								</div>
								<div className="text-muted-foreground">
									Started {created} • Expires {expires}
								</div>
								<div className="text-muted-foreground">
									{s.ipAddress ? `IP: ${s.ipAddress}` : "IP: unknown"} ·{" "}
									{s.userAgent
										? s.userAgent.slice(0, 64)
										: "user agent unknown"}
								</div>
							</div>

							<div className="flex items-center gap-2">
								{isCurrent ? (
									<span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
										Current
									</span>
								) : null}
								<Button
									variant="outline"
									size="sm"
									onClick={() => void revokeSession(s.id)}
									disabled={sessionAction !== null}
								>
									{sessionAction === s.id ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<LogOut className="mr-2 h-4 w-4" />
									)}
									Sign out
								</Button>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const deleteConfirmationMatches =
		deleteConfirmation.trim().toLowerCase() === "confirm";

	if (loading) {
		return (
			<div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6">
				<Loader2 className="h-5 w-5 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Loading settings…</p>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold text-foreground">
					Account &amp; Security
				</h1>
				<p className="text-sm text-muted-foreground">
					Manage your profile details, review active sessions, and control SSO
					connections powered by Better Auth.
				</p>
			</div>

			{error ? (
				<div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					<AlertTriangle className="h-4 w-4" />
					<span>{error}</span>
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto text-destructive underline"
						onClick={() => void loadAccountData()}
					>
						Retry
					</Button>
				</div>
			) : null}

			{success ? (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-100">
					<CheckCircle2 className="h-4 w-4" />
					<span>{success}</span>
				</div>
			) : null}

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
					<div className="flex items-start justify-between">
						<div>
							<h2 className="text-lg font-semibold text-foreground">Profile</h2>
							<p className="text-sm text-muted-foreground">
								Update your display name. Email is managed by Better Auth.
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => void loadAccountData()}
							title="Refresh"
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={profileName}
								onChange={(e) => setProfileName(e.target.value)}
								placeholder="Your name"
							/>
						</div>
						<div className="space-y-2">
							<Label>Email</Label>
							<Input
								value={accountData?.user.email ?? ""}
								readOnly
								className="bg-muted/60"
							/>
						</div>

						<Button
							onClick={() => void handleProfileSave()}
							disabled={savingProfile}
						>
							{savingProfile ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save changes
						</Button>
					</div>
				</div>

				<div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
					<div className="flex items-start justify-between">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Session security
							</h2>
							<p className="text-sm text-muted-foreground">
								Sign out from other devices or everywhere. Current session is
								managed by Better Auth cookies.
							</p>
						</div>
					</div>

					<div className="space-y-3">
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={() => void revokeOtherSessions()}
							disabled={sessionAction !== null}
						>
							{sessionAction === "others" ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ShieldOff className="mr-2 h-4 w-4" />
							)}
							Sign out of other sessions
						</Button>
						<Button
							variant="destructive"
							className="w-full justify-start"
							onClick={() => void revokeAllSessions()}
							disabled={sessionAction !== null}
						>
							{sessionAction === "all" ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<LogOut className="mr-2 h-4 w-4" />
							)}
							Sign out everywhere
						</Button>
						<Button
							variant="secondary"
							className="w-full justify-start"
							onClick={() => void declineSso()}
							disabled={sessionAction !== null || !hasSsoConnections}
							title={
								hasSsoConnections
									? "Disconnect SSO providers and sign out"
									: "No SSO connections detected"
							}
						>
							{sessionAction === "decline-sso" ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Globe className="mr-2 h-4 w-4" />
							)}
							Disconnect SSO &amp; sign out
						</Button>
						<p className="text-xs text-muted-foreground">
							Disconnecting SSO removes linked social logins (`account` rows)
							and clears all sessions.
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-lg font-semibold text-foreground">
							Authentication methods
						</h2>
						<p className="text-sm text-muted-foreground">
							Link social providers or manage your password.
						</p>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-3">
						<p className="text-sm font-semibold text-foreground">
							Connected accounts
						</p>
						<div className="space-y-2">
							<Button
								variant={
									hasProvider(accountData, "github") ? "outline" : "default"
								}
								className="w-full justify-start gap-2"
								onClick={() => void handleLinkSocial("github")}
								disabled={
									!!linkingProvider || hasProvider(accountData, "github")
								}
							>
								{linkingProvider === "github" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Github className="h-4 w-4" />
								)}
								{hasProvider(accountData, "github")
									? "GitHub connected"
									: "Connect GitHub"}
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2"
								onClick={() => void handleLinkSocial("google")}
								disabled
								title="Google linking pending verification"
							>
								<Loader2 className="h-4 w-4" />
								Google (pending verification)
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Linking keeps multiple sign-in options attached to one account.
							Google linking is pending verification.
						</p>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-semibold text-foreground">Password</p>
						<div className="space-y-3">
							{hasPasswordAccount(accountData) ? (
								<>
									<div className="space-y-2">
										<Label htmlFor="currentPassword">Current password</Label>
										<Input
											id="currentPassword"
											type="password"
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											placeholder="••••••••"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="newPassword">New password</Label>
										<Input
											id="newPassword"
											type="password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="••••••••"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirmPassword">
											Confirm new password
										</Label>
										<Input
											id="confirmPassword"
											type="password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="••••••••"
										/>
									</div>
									<Button
										onClick={() => void handleSetOrChangePassword("change")}
										disabled={
											!newPassword ||
											!currentPassword ||
											!confirmPassword ||
											linkingProvider !== null
										}
										className="w-full justify-center"
									>
										Change password
									</Button>
								</>
							) : (
								<>
									<div className="space-y-2">
										<Label htmlFor="newPassword">Create password</Label>
										<Input
											id="newPassword"
											type="password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="••••••••"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirmPassword">Confirm password</Label>
										<Input
											id="confirmPassword"
											type="password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="••••••••"
										/>
									</div>
									<Button
										onClick={() => void handleSetOrChangePassword("set")}
										disabled={!newPassword || !confirmPassword}
										className="w-full justify-center"
									>
										Set password
									</Button>
								</>
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							Passwords let you sign in without a provider. Changing your
							password will revoke other active sessions.
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-lg font-semibold text-foreground">
							Active sessions
						</h2>
						<p className="text-sm text-muted-foreground">
							Revoke individual sessions created by Better Auth.
						</p>
					</div>
				</div>

				{renderSessions()}
			</div>

			<div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-lg font-semibold text-destructive">
							Danger zone
						</h2>
						<p className="text-sm text-destructive/80">
							Delete your account and all projects and rooms associated with it.
							This action is immediate and cannot be undone.
						</p>
					</div>
					<AlertTriangle className="h-5 w-5 text-destructive" />
				</div>

				<div className="grid gap-3 md:grid-cols-[1.5fr,auto] md:items-end">
					<div className="space-y-2">
						<Label htmlFor="deleteConfirmation" className="text-destructive">
							Type confirm to continue
						</Label>
						<Input
							id="deleteConfirmation"
							value={deleteConfirmation}
							onChange={(e) => setDeleteConfirmation(e.target.value)}
							placeholder='Type "confirm"'
							className="border-destructive/50 focus-visible:ring-destructive"
						/>
						<p className="text-xs text-destructive/80">
							All projects and rooms are removed via cascading deletes. Linked
							files will no longer be accessible.
						</p>
					</div>
					<Button
						variant="destructive"
						className="w-full md:w-auto"
						disabled={!deleteConfirmationMatches || deletingAccount}
						onClick={() => void handleDeleteAccount()}
					>
						{deletingAccount ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<AlertTriangle className="mr-2 h-4 w-4" />
						)}
						Delete account
					</Button>
				</div>
			</div>
		</div>
	);
}
