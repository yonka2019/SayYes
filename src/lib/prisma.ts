import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and paste your Postgres connection string."
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Reuse one client across hot reloads in dev and across warm serverless
// invocations in production, so we don't exhaust the connection pool.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
