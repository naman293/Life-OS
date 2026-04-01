import * as fs from "fs";
import * as path from "path";

// Load .env.local for local development (Next.js convention)
function loadEnvLocal() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envPath = path.resolve(process.cwd(), ".env");

  for (const p of [envLocalPath, envPath]) {
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvLocal();

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
