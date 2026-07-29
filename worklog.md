# Himal Commerce — Work Log

---
Task ID: deploy-1
Agent: main (Super Z)
Task: Deploy Himal Commerce to GitHub + Vercel

Work Log:
- Removed leaked GitHub PAT from .env.local (was shared in chat)
- Added `scripts/swap-prisma-provider.js` to swap sqlite ↔ postgresql at build time
- Added `scripts/vercel-build.js` orchestrator: prisma generate → db push → optional seed → next build
- Added `vercel.json` with custom build command + DATABASE_PROVIDER=postgresql env
- Added `README.md` with local dev + Vercel deploy instructions
- Removed `.env` from git tracking (was a stale commit, only had local SQLite path)
- Generated SSH keypair at `/home/z/.ssh/id_ed25519` (not used in the end — no ssh binary)
- Stored fresh GitHub PAT in `~/.git-credentials` (mode 600, gitignored globally)
- Created GitHub repo `bymeanime/himal-commerce` (public) and pushed 6 commits
- Stored Vercel token in `~/.config/vercel/token` (mode 600, gitignored globally)
- Linked local project to Vercel project `himal-commerce` (prj_zk91Qz7LzxagVS9mYjLygtJa7zFE)
- Provisioned Neon Postgres (free tier) at ap-southeast-1 (Singapore, closest to Nepal)
- Set env vars: DATABASE_PROVIDER=postgresql, DATABASE_URL=<neon>, SEED_ON_BUILD=1 (production)
- Triggered production deploy via `vercel --prod`
- Disabled SSO deployment protection so public URL is accessible
- Verified deployment is READY and serving: 3 stores, 14 orders, 20 products, 10 customers, NPR 2,290,000 seeded revenue
- Removed SEED_ON_BUILD env var so future deploys preserve data

Stage Summary:
- GitHub: https://github.com/bymeanime/himal-commerce (6 commits, public)
- Vercel: https://himal-commerce-44ug4wek5-bymeanime-6935s-projects.vercel.app (live, public, seeded)
- Database: Neon Postgres (Singapore region)
- Secrets stored: GitHub PAT (~/.git-credentials), Vercel token (~/.config/vercel/token) — both gitignored globally
- Future workflow: edit code → git push origin main → Vercel auto-deploys
- TODO for user: revoke the OLD leaked PAT at github.com/settings/tokens (the one starting with github_pat_11BSXGQOQ0) — the new one in use is fine
