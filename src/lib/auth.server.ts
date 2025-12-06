import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { PrismaClient } from "../../prisma/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

const prisma = new PrismaClient({
	adapter: new PrismaPg({
		connectionString: env.DATABASE_URL,
	}),
});

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	experimental: { joins: true },
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		requireEmailVerification: false, // allow email/password sign-ups without sending a verification email
	},
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	session: {
		modelName: "session",
		fields: {
			userId: "userId",
		},
		expiresIn: 30 * 24 * 60 * 60, // 30 days
		updateAge: 24 * 60 * 60, // 1 day
		disableSessionRefresh: true, // Disable session refresh so that the session is not updated regardless of the `updateAge` option. (default: `false`)
		storeSessionInDatabase: true, // Store session in database when secondary storage is provided (default: `false`)
		preserveSessionInDatabase: false, // Preserve session records in database when deleted from secondary storage (default: `false`)
		cookieCache: {
			enabled: true, // Enable caching session in cookie (default: `false`)
			maxAge: 300, // 5 minutes
		},
	},
	plugins: [tanstackStartCookies()],
});
