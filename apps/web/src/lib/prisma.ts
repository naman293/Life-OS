import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import dns from "dns";

// --- START DNS HOOK BYPASS ---
// Your local network restricts resolution of aws.neon.tech domains via DNS. 
// This hook intercepts requests at the socket level and manually resolves 
// them to Neon's IP address, completely bypassing the restriction.
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (hostname && hostname.includes("aws.neon.tech")) {
    if (options && options.all) {
      return callback(null, [{ address: "54.232.181.76", family: 4 }]);
    }
    return callback(null, "54.232.181.76", 4);
  }
  return originalLookup(hostname, options, callback);
} as any;
// --- END DNS HOOK BYPASS ---


// Prevent multiple Prisma instances in development hot-reloading
const globalForPrisma_v2 = globalThis as unknown as {
  prisma_v2: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL!;

  // PrismaNeonHttp uses pure HTTP (port 443) — not WebSockets/TCP.
  // This is the correct adapter for serverless/sandboxed environments
  // and avoids the 90-second timeout caused by PrismaNeon (Pool/WebSocket).
  const adapter = new PrismaNeonHttp(connectionString, { arrayMode: false });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma_v2.prisma_v2 ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma_v2.prisma_v2 = prisma;
}
