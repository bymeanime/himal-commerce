# Himal Commerce

A **multi-tenant commerce platform** (Medusa-style) built with Next.js 16, Prisma, and Tailwind. One platform, many independent stores — each with its own products, orders, customers, branding, and currency.

Ships with a Nepal-localized reference store (NPR currency, all 77 districts, eSewa/Khalti/COD payments) as the default tenant.

## Stack

- **Next.js 16** (App Router, standalone output)
- **Prisma** (SQLite for local dev, Postgres for production)
- **Tailwind CSS 4** + **shadcn/ui**
- **Bun** (package manager + TS runner)

## Local development

```bash
bun install
bun run db:push     # creates SQLite file + tables
bun run db:generate # generates Prisma client
bun run seed        # optional — seeds Nepal reference store
bun run dev
```

Open http://localhost:3000.

## Project layout

```
src/
  app/
    (storefront)/   # public storefront routes
    (admin)/        # admin dashboard per store
    (platform)/     # platform-level (create store, manage tenants)
  lib/
    db.ts           # Prisma client singleton
    nepal.ts        # Nepal districts, products, shipping rules
prisma/
  schema.prisma     # multi-tenant schema (Store → Products/Orders/...)
scripts/
  swap-prisma-provider.js  # swaps sqlite ↔ postgresql at build time
  vercel-build.js          # Vercel build orchestrator
  seed.ts                  # seeds Nepal reference store
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
# from the project root
git add -A
git commit -m "prep: vercel deployment"
gh repo create himal-commerce --public --source=. --remote=origin --push
# or, if you already created an empty repo on github.com:
git remote add origin git@github.com:<your-user>/himal-commerce.git
git branch -M main
git push -u origin main
```

### 2. Create a Postgres database

Easiest options (any of these work, all have free tiers):

- **Vercel Postgres** — https://vercel.com/docs/storage/vercel-postgres
- **Neon** — https://neon.tech
- **Supabase** — https://supabase.com

Grab the `DATABASE_URL` connection string (it should start with `postgres://` or `postgresql://`).

### 3. Import the repo on Vercel

1. Go to https://vercel.com/new
2. Import your `himal-commerce` GitHub repo.
3. Vercel will auto-detect Next.js and use `vercel.json`.
4. In **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `DATABASE_PROVIDER` | `postgresql` |
   | `DATABASE_URL` | *(your Postgres connection string)* |
   | `SEED_ON_BUILD` | `1` *(set this ONLY for the first deploy, then remove it)* |
5. Click **Deploy**.

On the first deploy:
- `vercel-build.js` swaps the Prisma provider to `postgresql`.
- `prisma db push` creates all tables on your Postgres DB.
- `seed.ts` populates the Nepal reference store.
- `next build` compiles the app.

After the first successful deploy, **remove `SEED_ON_BUILD`** so subsequent deploys don't wipe data.

### 4. Subsequent deploys

Just `git push` to `main`. Vercel auto-rebuilds.

## Security notes

- **Never commit `.env` files.** They are gitignored.
- **Never paste GitHub PATs, API keys, or DB passwords into chat.** Rotate anything that's been shared.
- Use `gh auth login` to authenticate with GitHub from the CLI instead of PATs when possible.
- Store secrets in Vercel's Environment Variables UI (or `vercel env add`), never in code.
