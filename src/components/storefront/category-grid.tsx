import Link from 'next/link'
import { db } from '@/lib/db'
import { FolderTree, ArrowRight } from 'lucide-react'

// Server component — fetches categories for a store and renders a "Shop by category" grid.
// Each card links to the SSR category page at /s/[slug]/c/[categorySlug].
export async function CategoryGrid({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  // Fetch top-level categories (no parent) with product counts
  const categories = await db.category.findMany({
    where: { storeId, parentId: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    take: 12,
    include: {
      _count: { select: { products: true } },
      children: {
        take: 4,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true },
      },
    },
  })

  if (categories.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-3 py-1 text-xs mb-2">
            <FolderTree className="h-3 w-3 text-primary" />
            <span>Browse</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Shop by category</h2>
        </div>
        <Link
          href={`/s/${storeSlug}/c/all`}
          className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/s/${storeSlug}/c/${cat.slug}`}
            className="group relative overflow-hidden rounded-xl border border-border/60 bg-card hover:border-primary hover:shadow-md transition-all"
          >
            <div className="aspect-[4/3] relative bg-secondary/40">
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                  <FolderTree className="h-10 w-10" />
                </div>
              )}
              {cat._count.products > 0 && (
                <span className="absolute top-2 right-2 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium border border-border/60">
                  {cat._count.products} {cat._count.products === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
              )}
              {cat.children.length > 0 && (
                <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-1">
                  {cat.children.map((c) => c.name).join(' · ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
