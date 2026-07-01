import { PrismaClient } from "@prisma/client";

function isValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
  } catch {
    return false;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

if (!process.env.DATABASE_URL) {
  console.warn("[Prisma] DATABASE_URL is not set. Application may not function correctly.");
} else if (!isValidDatabaseUrl()) {
  console.warn("[Prisma] DATABASE_URL appears invalid. Check the connection string format.");
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function pingDb(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
