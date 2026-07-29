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

---
Task ID: features-1
Agent: main (Super Z)
Task: Add product variants, category pages, social media links, fix critical bugs

Work Log:
- Audited codebase via subagent — found fake eSewa/Khalti payment (instant 'paid'),
  inventory oversell silent failure, non-functional Settings page (every Save was
  a no-op toast), missing ProductVariant/ProductImage models, no category admin
  page, no social media fields, no store-switcher in admin
- Updated prisma/schema.prisma: added ProductVariant, ProductImage models; added
  Store fields (tagline, bannerUrl, supportPhone, supportEmail, address,
  socialTwitter/Facebook/Instagram/Tiktok/Youtube); added Category fields
  (description, imageUrl, parentId, sortOrder); added Product.slug; added
  OrderItem.variantId + variantTitle; added 'pending' to Order.paymentStatus
- Updated src/lib/types.ts to mirror new schema
- Updated src/lib/cart-store.ts to track variantId + variantTitle per cart line
- Updated src/lib/nepal.ts to seed: tagline/contact/socials on all 3 stores;
  variants on 5 products (Dhaka Topi sizes, Silver Ring sizes 6-11, Ilam First
  Flush tea 100g/250g/500g, Pashmina Shawl 4 colors, Yak Sweater S/M/L/XL)
- Updated scripts/seed.ts to handle variants + all new store fields
- Updated src/app/api/products/route.ts + [id]/route.ts: variants on GET/POST/PUT
  (PUT does diff by id with _destroy for deletes); slug auto-generation
- Updated src/app/api/categories/route.ts + new [id]/route.ts (PUT/DELETE with
  reassignTo / force options for product-attached categories)
- Updated src/app/api/stores/[id]/route.ts PUT to accept all new social/contact
- REWROTE src/app/api/checkout/route.ts:
  - Digital payments (esewa/khalti) now mark 'pending' (was 'paid' — financial bug)
  - Inventory decrement is atomic (WHERE inventory >= qty via updateMany)
  - Variant inventory checked per-variant
  - Server-side product/variant verification (never trust client prices)
- New src/components/admin/categories.tsx — full CRUD with create dialog,
  edit sheet, delete confirm (handles products-attached case)
- Updated src/components/admin/admin-shell.tsx — added Categories to nav,
  added StoreSwitcher dropdown (lists all stores, click to switch)
- REWROTE src/components/admin/products.tsx — added VariantsEditor with
  per-variant title/sku/price/inventory/attributes editor; added weightGrams
  field; variant-aware submit on create + edit
- REWROTE src/components/admin/settings.tsx — wired to PUT /api/stores/[id]
  via react-hook-form-style state; dirty indicator + Save button; color
  pickers for branding; social media editor; informational cards for
  payment/shipping/localization (with explanation that real config is Phase 2)
- New src/components/storefront/category-view.tsx — dedicated category page
  with breadcrumb, hero image, sibling category switcher, search+sort, grid
- Updated src/components/storefront/storefront.tsx — added 'category' section
- Updated src/components/storefront/header.tsx — Categories dropdown (desktop)
  + categories list in mobile menu; uses real store.supportPhone in announcement bar
- Updated src/components/storefront/footer.tsx — social icons (FB/IG/TikTok/YT/X)
  using real store fields; uses real store.supportPhone/supportEmail/address
- Updated src/components/storefront/product-card.tsx — shows "X options" badge
  for variant products; shows price range when variants have different prices;
  "Add to cart" becomes "Choose option" for variant products (opens drawer)
- REWROTE src/components/storefront/product-detail-drawer.tsx — variant picker
  with selectable buttons; per-variant price + inventory display; effective
  price/inventory drives add-to-cart; variant SKU shown
- Updated src/components/storefront/cart-drawer.tsx — shows variantTitle;
  remove/setQuantity use variantId; key by productId+variantId
- Updated src/components/storefront/checkout-modal.tsx — sends variantId per
  item; shows variantTitle in order review
- Stopped tracking local SQLite db/custom.db (gitignored /db/)

Stage Summary:
- Production deploy: https://himal-commerce-caqkaxi3d-bymeanime-6935s-projects.vercel.app
- GitHub: commit 722353c pushed to main
- Schema migrated to Neon Postgres via prisma db push (in vercel-build.js)
- Seed re-ran with new variant data (20 variants across 5 products)
- SEED_ON_BUILD re-enabled for this deploy, then removed after success
  (future deploys preserve data)
- 3 stores, 13 categories, 20 products, 20 variants, 18 customers, 16 orders
- All social media + contact fields populated for all 3 stores
- Local build verified passing before push
- Vercel deployment status: READY

Deferred to Phase 2 (per user conversation):
- Migrate SPA hash routing → real Next.js routes (for SEO/shareable URLs)
- Real auth (next-auth + phone OTP via SparrowSMS)
- Real eSewa/Khalti gateway integration (needs merchant credentials)
- Reviews, discounts, wishlist, email/SMS, analytics
