import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const { auth } = await import("@/lib/auth.server");
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return await next();
	},
);
