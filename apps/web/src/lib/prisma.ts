import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Prevent multiple Prisma instances in development hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL!;

  // PrismaNeonHttp uses pure HTTP (port 443) — not WebSockets/TCP.
  // This is the correct adapter for serverless/sandboxed environments
  // and avoids the 90-second timeout caused by PrismaNeon (Pool/WebSocket).
  const adapter = new PrismaNeonHttp(connectionString, { arrayMode: false });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
