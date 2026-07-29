#!/usr/bin/env node
/**
 * Swaps the Prisma datasource provider based on the DATABASE_PROVIDER env var.
 *
 *  - Local dev (default):  DATABASE_PROVIDER=sqlite  → uses ./prisma/dev.db
 *  - Vercel / production:  DATABASE_PROVIDER=postgresql → uses DATABASE_URL (Vercel Postgres / Neon / Supabase)
 *
 * Why a script? Prisma does not allow `provider = env(...)` in schema.prisma —
 * it must be a literal. So we patch the file in-place at build time.
 *
 * Run automatically via `prebuild` and `postinstall` (see package.json).
 */
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const desired = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();

if (!["sqlite", "postgresql"].includes(desired)) {
  console.error(`[prisma-provider] Unknown DATABASE_PROVIDER="${desired}". Use sqlite or postgresql.`);
  process.exit(1);
}

const original = fs.readFileSync(schemaPath, "utf8");
const patched = original.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${desired}"`
);

if (original === patched) {
  console.log(`[prisma-provider] Provider already "${desired}", no change.`);
} else {
  fs.writeFileSync(schemaPath, patched);
  console.log(`[prisma-provider] Patched schema.prisma → provider = "${desired}"`);
}
