#!/usr/bin/env node
/**
 * Vercel build orchestrator.
 *
 * Runs in this order:
 *   1. Swap Prisma provider to whatever DATABASE_PROVIDER says (default sqlite).
 *   2. prisma generate  — produce the @prisma/client for the current provider.
 *   3. prisma db push   — create/sync tables on the production DB (only if
 *                          DATABASE_PROVIDER=postgresql AND DATABASE_URL is set).
 *   4. next build       — the actual Next.js build.
 *
 * Seeding: only runs if SEED_ON_BUILD=1. After the very first deploy, you
 * usually want this OFF so you don't wipe prod data on every deploy.
 */
const { execSync } = require("child_process");

const run = (cmd, label) => {
  console.log(`\n▶ ${label}: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

const provider = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();
const hasDatabaseUrl = !!process.env.DATABASE_URL;

run("node scripts/swap-prisma-provider.js", "swap-prisma-provider");
run("npx prisma generate", "prisma generate");

if (provider === "postgresql" && hasDatabaseUrl) {
  console.log("\n[vercel-build] Pushing schema to Postgres (accept-data-loss on first deploy)…");
  run("npx prisma db push --accept-data-loss", "prisma db push");
} else {
  console.log(`\n[vercel-build] Skipping db push (provider=${provider}, hasDatabaseUrl=${hasDatabaseUrl})`);
}

if (process.env.SEED_ON_BUILD === "1") {
  console.log("\n[vercel-build] SEED_ON_BUILD=1 → running seed…");
  run("bun run scripts/seed.ts", "seed");
} else {
  console.log("[vercel-build] SEED_ON_BUILD not set → skipping seed.");
}

run("next build", "next build");

console.log("\n[vercel-build] Done.");
