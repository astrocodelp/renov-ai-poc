import { createAuthClient } from "better-auth/react";

// Better Auth client requires an absolute baseURL. Build it from window origin on the client,
// and fall back to localhost for SSR/shell evaluation paths.
const baseURL =
	typeof window !== "undefined"
		? new URL("/api/auth", window.location.origin).toString()
		: "http://localhost:8749/api/auth";

export const authClient = createAuthClient({
	baseURL,
});
