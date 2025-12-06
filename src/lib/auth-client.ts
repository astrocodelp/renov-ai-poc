import { createAuthClient } from "better-auth/client";
import { env } from "@/env";

// Better Auth client requires an absolute baseURL. Build it from window origin on the client,
// and fall back to localhost for SSR/shell evaluation paths.
const baseURL =
	typeof window !== "undefined"
		? new URL("/api/auth", window.location.origin).toString()
		: new URL(
				"/api/auth",
				env.BETTER_AUTH_URL ?? "http://localhost:8749",
			).toString();

export const authClient = createAuthClient({
	baseURL,
});
