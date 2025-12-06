import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "@/db";
import { auth } from "@/lib/auth";

type AccountAction =
	| { action: "update-profile"; name?: string }
	| { action: "revoke-session"; sessionId?: string }
	| { action: "revoke-all-sessions" }
	| { action: "revoke-other-sessions"; currentSessionId?: string | null }
	| { action: "decline-sso" }
	| { action: "set-password"; newPassword?: string }
	| {
			action: "change-password";
			currentPassword?: string;
			newPassword?: string;
	  }
	| { action: "delete-account"; confirmation?: string };

const json = (status: number, data: unknown) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});

export const Route = createFileRoute("/api/settings/account")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return json(401, { error: "Unauthorized" });
				}

				const userId = session.user.id;

				const [user, sessions, accounts] = await Promise.all([
					prisma.user.findUnique({
						where: { id: userId },
						select: {
							id: true,
							name: true,
							email: true,
							emailVerified: true,
							image: true,
							createdAt: true,
							updatedAt: true,
						},
					}),
					prisma.session.findMany({
						where: { userId },
						orderBy: { createdAt: "desc" },
						select: {
							id: true,
							createdAt: true,
							updatedAt: true,
							expiresAt: true,
							ipAddress: true,
							userAgent: true,
						},
					}),
					prisma.account.findMany({
						where: { userId },
						orderBy: { createdAt: "desc" },
						select: {
							id: true,
							providerId: true,
							createdAt: true,
							updatedAt: true,
							scope: true,
						},
					}),
				]);

				if (!user) {
					return json(404, { error: "User not found" });
				}

				return json(200, { user, sessions, accounts });
			},
			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return json(401, { error: "Unauthorized" });
				}

				let body: AccountAction | null = null;
				try {
					body = (await request.json()) as AccountAction;
				} catch {
					return json(400, { error: "Invalid JSON body" });
				}

				if (!body?.action) {
					return json(400, { error: "Missing action" });
				}

				const userId = session.user.id;

				switch (body.action) {
					case "update-profile": {
						const name = (body.name ?? "").trim();
						if (!name) {
							return json(400, { error: "Name is required" });
						}

						const updatedUser = await prisma.user.update({
							where: { id: userId },
							data: { name },
							select: {
								id: true,
								name: true,
								email: true,
								emailVerified: true,
								image: true,
								createdAt: true,
								updatedAt: true,
							},
						});

						// Force Better Auth to update the session cookie with new user data
						await auth.api.updateUser({
							headers: request.headers,
							body: { name },
						});

						return json(200, { status: "profile_updated", user: updatedUser });
					}
					case "revoke-session": {
						if (!body.sessionId) {
							return json(400, { error: "sessionId is required" });
						}

						const deleted = await prisma.session.deleteMany({
							where: { id: body.sessionId, userId },
						});

						if (!deleted.count) {
							return json(404, { error: "Session not found" });
						}

						return json(200, {
							status: "session_revoked",
							sessionId: body.sessionId,
						});
					}
					case "revoke-other-sessions": {
						const currentSessionId = body.currentSessionId ?? undefined;

						await prisma.session.deleteMany({
							where: {
								userId,
								...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
							},
						});

						return json(200, { status: "other_sessions_revoked" });
					}
					case "revoke-all-sessions": {
						await prisma.session.deleteMany({ where: { userId } });
						return json(200, { status: "all_sessions_revoked" });
					}
					case "decline-sso": {
						await prisma.account.deleteMany({ where: { userId } });
						await prisma.session.deleteMany({ where: { userId } });
						return json(200, { status: "sso_connections_removed" });
					}
					case "set-password": {
						const newPassword = (body.newPassword ?? "").trim();
						if (!newPassword) {
							return json(400, { error: "New password is required" });
						}

						try {
							await auth.api.setPassword({
								body: { newPassword },
								headers: request.headers,
							});
							return json(200, { status: "password_set" });
						} catch (err) {
							const message =
								err instanceof Error ? err.message : "Unable to set password";
							return json(400, { error: message });
						}
					}
					case "change-password": {
						const currentPassword = (body.currentPassword ?? "").trim();
						const newPassword = (body.newPassword ?? "").trim();

						if (!currentPassword || !newPassword) {
							return json(400, {
								error: "Current and new password are required",
							});
						}

						try {
							await auth.api.changePassword({
								body: {
									currentPassword,
									newPassword,
									revokeOtherSessions: true,
								},
								headers: request.headers,
							});
							return json(200, { status: "password_changed" });
						} catch (err) {
							const message =
								err instanceof Error
									? err.message
									: "Unable to change password";
							return json(400, { error: message });
						}
					}
					case "delete-account": {
						const confirmation = (body.confirmation ?? "").trim().toLowerCase();

						if (confirmation !== "confirm") {
							return json(400, {
								error: 'You must type "confirm" to delete your account',
							});
						}

						await prisma.user.delete({ where: { id: userId } });
						return json(200, { status: "account_deleted" });
					}
					default:
						return json(400, { error: "Unknown action" });
				}
			},
		},
	},
});
