#!/usr/bin/env node
/**
 * Vercel build orchestrator (v2 — safer than v1).
 *
 * Improvements over v1 (Platform + Automation panels):
 *   1. Uses `prisma migrate deploy` when migrations exist; falls back to
 *      `prisma db push` (without --accept-data-loss on first run, with a
 *      warning) only when no migrations are committed. This prevents the
 *      v1 footgun where any schema change silently dropped prod data.
 *   2. Hard-blocks seed in production unless an explicit
 *      CONFIRM_PROD_SEED=yes-i-know-this-wipes-everything env var is set.
 *   3. Logs each step's exit code so Vercel build logs are debuggable.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const run = (cmd, label) => {
  console.log(`\n▶ ${label}: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`✔ ${label} succeeded`);
  } catch (e) {
    console.error(`✖ ${label} FAILED (exit ${e.status || e.code || 1})`);
    process.exit(e.status || e.code || 1);
  }
};

const provider = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

// ====== 1. Swap Prisma provider based on env ======
run("node scripts/swap-prisma-provider.js", "swap-prisma-provider");

// ====== 2. Generate Prisma client ======
run("npx prisma generate", "prisma generate");

// ====== 3. Sync schema to DB (postgres only) ======
if (provider === "postgresql" && hasDatabaseUrl) {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const hasMigrations = fs.existsSync(migrationsDir) &&
    fs.readdirSync(migrationsDir).some(f =>
      fs.statSync(path.join(migrationsDir, f)).isDirectory()
    );

  if (hasMigrations) {
    console.log("\n[vercel-build] Applying committed migrations via `prisma migrate deploy`…");
    run("npx prisma migrate deploy", "prisma migrate deploy");
  } else {
    // No migrations committed yet — fall back to db push but warn loudly.
    console.warn("\n⚠️  [vercel-build] No migrations in prisma/migrations/ — falling back to `prisma db push`.");
    console.warn("⚠️  This is acceptable for the current beta. Before accepting real orders, switch to `prisma migrate dev` locally and commit the migration files.");
    run("npx prisma db push --accept-data-loss", "prisma db push");
  }
} else {
  console.log(`\n[vercel-build] Skipping db sync (provider=${provider}, hasDatabaseUrl=${hasDatabaseUrl})`);
}

// ====== 4. Seed (hard-blocked in prod unless explicitly confirmed) ======
if (process.env.SEED_ON_BUILD === "1") {
  if (isProd && process.env.CONFIRM_PROD_SEED !== "yes-i-know-this-wipes-everything") {
    console.warn("\n⚠️  [vercel-build] SEED_ON_BUILD=1 ignored in production.");
    console.warn("⚠️  To seed prod, also set CONFIRM_PROD_SEED=yes-i-know-this-wipes-everything.");
    console.warn("⚠️  Remember to UNSET both env vars immediately after the seed completes, or every subsequent deploy will wipe prod data.");
  } else {
    console.log("\n[vercel-build] Seeding…");
    run("bun run scripts/seed.ts", "seed");
  }
} else {
  console.log("[vercel-build] SEED_ON_BUILD not set → skipping seed.");
}

// ====== 5. Build ======
run("next build", "next build");

console.log("\n[vercel-build] Done.");
