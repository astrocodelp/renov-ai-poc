import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});


export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8749",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  experimental: { joins: true },
  emailAndPassword: {
    enabled: false, // DISABLE THE NEED TO LOGIN WITH EMAIL AND PASSWORD FOR NOW
    autoSignIn: true,
  },
  socialProviders: {
    github: { 
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
    }, 
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [tanstackStartCookies()],
});