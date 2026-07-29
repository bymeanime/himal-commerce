'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { formatNPR } from '@/lib/nepal'
import type { Product, Category } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'
import { Plus, Search, Pencil, Trash2, Package, MapPin, Hammer, Eye, EyeOff, X, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function AdminProducts() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products', 'admin', storeId, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ storeId: storeId! })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('q', search)
      const res = await fetch(`/api/products?${params}`)
      return res.json()
    },
    enabled: !!storeId,
  })
  const { data: catData } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories', storeId],
    queryFn: async () => (await fetch(`/api/categories?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Product deleted')
      setDeleting(null)
    },
    onError: () => toast.error('Failed to delete product'),
  })

  const products = data?.products ?? []
  const categories = catData?.categories ?? []

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} products in your catalog.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, subtitle, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Product</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-right font-medium px-4 py-3">Price</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">Inventory</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No products yet. Click &quot;New product&quot; to add your first.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-t border-border/40 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                            {p.thumbnail && <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{p.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              {p.origin && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{p.origin}</span>}
                              {p.isHandmade && <span className="flex items-center gap-0.5"><Hammer className="h-3 w-3" />Handmade</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {p.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNPR(p.price)}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={p.inventory <= 5 ? 'text-red-600 font-semibold' : ''}>
                          {p.inventory}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>
                          {p.status === 'published' ? <Eye className="h-3 w-3 mr-0.5" /> : <EyeOff className="h-3 w-3 mr-0.5" />}
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create dialog */}
      {creating && (
        <ProductFormDialog
          open={creating}
          onOpenChange={setCreating}
          categories={categories}
          storeId={storeId}
        />
      )}

      {/* Edit sheet */}
      {editing && (
        <ProductFormSheet
          product={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          categories={categories}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleting?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMut.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Create dialog ----------
function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  storeId,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  categories: Category[]
  storeId: string
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    thumbnail: '',
    price: '',
    compareAt: '',
    sku: '',
    inventory: '0',
    weightGrams: '',
    origin: '',
    isHandmade: false,
    status: 'published',
    categoryId: '',
    variants: [] as VariantForm[],
  })

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ...form,
          price: Number(form.price),
          compareAt: form.compareAt ? Number(form.compareAt) : null,
          inventory: Number(form.inventory),
          weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
          categoryId: form.categoryId || null,
          variants: form.variants.filter(v => v.title.trim()).map(v => ({
            title: v.title,
            sku: v.sku || null,
            price: v.price ? Number(v.price) : null,
            inventory: Number(v.inventory) || 0,
            attributes: v.attributes,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Product created')
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to create product'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader>
          <DialogTitle>New product</DialogTitle>
          <DialogDescription>Add a new product to your catalog.</DialogDescription>
        </DialogHeader>

        <ProductForm form={form} setForm={setForm} categories={categories} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createMut.mutate()}
            disabled={!form.title || !form.description || !form.price || createMut.isPending}
          >
            {createMut.isPending ? 'Creating…' : 'Create product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Edit sheet ----------
function ProductFormSheet({
  product,
  open,
  onOpenChange,
  categories,
}: {
  product: Product
  open: boolean
  onOpenChange: (b: boolean) => void
  categories: Category[]
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: product.title,
    subtitle: product.subtitle || '',
    description: product.description,
    thumbnail: product.thumbnail || '',
    price: String(product.price / 100),
    compareAt: product.compareAt ? String(product.compareAt / 100) : '',
    sku: product.sku || '',
    inventory: String(product.inventory),
    weightGrams: product.weightGrams ? String(product.weightGrams) : '',
    origin: product.origin || '',
    isHandmade: product.isHandmade,
    status: product.status,
    categoryId: product.categoryId || '',
    variants: (product.variants ?? []).map(v => ({
      id: v.id,
      title: v.title,
      sku: v.sku || '',
      price: v.price ? String(v.price / 100) : '',
      inventory: String(v.inventory),
      attributes: v.attributes || {},
    })) as VariantForm[],
  })

  // Fetch fresh product with variants when sheet opens (in case list view didn't include them)
  useQuery({
    queryKey: ['product', product.id, open],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product.id}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.product as Product & { variants: VariantForm[] }
    },
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const updateMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          compareAt: form.compareAt ? Number(form.compareAt) : null,
          inventory: Number(form.inventory),
          weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
          categoryId: form.categoryId || null,
          variants: form.variants.map(v => ({
            ...(v.id ? { id: v.id } : {}),
            title: v.title,
            sku: v.sku || null,
            price: v.price ? Number(v.price) : null,
            inventory: Number(v.inventory) || 0,
            attributes: v.attributes,
            ...(v._destroy ? { _destroy: true } : {}),
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Product updated')
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to update product'),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto nice-scroll">
        <SheetHeader>
          <SheetTitle>Edit product</SheetTitle>
          <SheetDescription>{product.title}</SheetDescription>
        </SheetHeader>

        <div className="px-1 py-4">
          <ProductForm form={form} setForm={setForm} categories={categories} />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => updateMut.mutate()}
            disabled={!form.title || !form.description || !form.price || updateMut.isPending}
          >
            {updateMut.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ---------- Shared form fields ----------
type VariantForm = {
  id?: string
  title: string
  sku: string
  price: string // NPR — empty string means "use product price"
  inventory: string
  attributes: Record<string, string>
  _destroy?: boolean
}

function ProductForm({
  form,
  setForm,
  categories,
}: {
  form: Record<string, unknown>
  setForm: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  categories: Category[]
}) {
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const variants = (form.variants as VariantForm[]) ?? []
  const setVariants = (v: VariantForm[]) => setForm((f) => ({ ...f, variants: v }))

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input value={form.title as string} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Handwoven Dhaka Topi" />
      </div>
      <div className="space-y-1.5">
        <Label>Subtitle</Label>
        <Input value={form.subtitle as string} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Traditional Nepali cap" />
      </div>
      <div className="space-y-1.5">
        <Label>Description *</Label>
        <Textarea
          rows={4}
          value={form.description as string}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Detailed product description…"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Image URL</Label>
        <Input value={form.thumbnail as string} onChange={(e) => set('thumbnail', e.target.value)} placeholder="https://…" />
        {form.thumbnail && (
          <div className="h-24 w-full rounded-md overflow-hidden bg-muted">
            <img src={form.thumbnail as string} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Price (NPR) *</Label>
          <Input type="number" value={form.price as string} onChange={(e) => set('price', e.target.value)} placeholder="850" />
          <p className="text-[11px] text-muted-foreground">Base price. Variants can override.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Compare-at price (NPR)</Label>
          <Input type="number" value={form.compareAt as string} onChange={(e) => set('compareAt', e.target.value)} placeholder="1200" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input value={form.sku as string} onChange={(e) => set('sku', e.target.value)} placeholder="DHAKA-TOP-001" />
        </div>
        <div className="space-y-1.5">
          <Label>Inventory</Label>
          <Input type="number" value={form.inventory as string} onChange={(e) => set('inventory', e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Used when no variants, or as fallback.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Origin (district)</Label>
          <Input value={form.origin as string} onChange={(e) => set('origin', e.target.value)} placeholder="Palpa" />
        </div>
        <div className="space-y-1.5">
          <Label>Weight (grams)</Label>
          <Input type="number" value={(form.weightGrams as string) ?? ''} onChange={(e) => set('weightGrams', e.target.value)} placeholder="250" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={form.categoryId as string} onValueChange={(v) => set('categoryId', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status as string} onValueChange={(v) => set('status', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label className="cursor-pointer">Handmade</Label>
          <p className="text-xs text-muted-foreground">Show &quot;Handmade&quot; badge on storefront</p>
        </div>
        <Switch checked={form.isHandmade as boolean} onCheckedChange={(v) => set('isHandmade', v)} />
      </div>

      <VariantsEditor variants={variants} onChange={setVariants} />
    </div>
  )
}

// ---------- Variants editor ----------
function VariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantForm[]
  onChange: (v: VariantForm[]) => void
}) {
  const visibleVariants = variants.filter((v) => !v._destroy)

  const addVariant = () => {
    onChange([
      ...variants,
      { title: '', sku: '', price: '', inventory: '0', attributes: {} },
    ])
  }

  const updateVariant = (idx: number, patch: Partial<VariantForm>) => {
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
  }

  const removeVariant = (idx: number) => {
    const v = variants[idx]
    if (v.id) {
      onChange(variants.map((vv, i) => (i === idx ? { ...vv, _destroy: true } : vv)))
    } else {
      onChange(variants.filter((_, i) => i !== idx))
    }
  }

  return (
    <div className="space-y-2 rounded-lg border p-3 bg-secondary/20">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Variants</Label>
          <p className="text-[11px] text-muted-foreground">
            Optional — for size, color, or weight options. If empty, the product is sold as-is.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addVariant}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add variant
        </Button>
      </div>
      {visibleVariants.length === 0 ? (
        <p className="text-xs text-muted-foreground/70 italic py-2">
          No variants. Product uses the base price and inventory shown above.
        </p>
      ) : (
        <div className="space-y-2">
          {visibleVariants.map((v, idx) => (
            <div key={idx} className="rounded-md border bg-background p-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2 shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Variant label (e.g. Red / Large, 250g, Size 8)"
                    value={v.title}
                    onChange={(e) => updateVariant(idx, { title: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="SKU (optional)"
                    value={v.sku}
                    onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                    className="text-sm font-mono"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeVariant(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-12 shrink-0">NPR</span>
                  <Input
                    type="number"
                    placeholder="use base"
                    value={v.price}
                    onChange={(e) => updateVariant(idx, { price: e.target.value })}
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-12 shrink-0">Stock</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={v.inventory}
                    onChange={(e) => updateVariant(idx, { inventory: e.target.value })}
                    className="text-sm h-8"
                  />
                </div>
              </div>
              <VariantAttributesEditor
                attrs={v.attributes}
                onChange={(attrs) => updateVariant(idx, { attributes: attrs })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VariantAttributesEditor({
  attrs,
  onChange,
}: {
  attrs: Record<string, string>
  onChange: (a: Record<string, string>) => void
}) {
  const entries = Object.entries(attrs)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const add = () => {
    if (!newKey.trim()) return
    onChange({ ...attrs, [newKey.trim()]: newValue.trim() })
    setNewKey('')
    setNewValue('')
  }
  const remove = (k: string) => {
    const next = { ...attrs }
    delete next[k]
    onChange(next)
  }

  return (
    <div className="pl-6 space-y-1.5">
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entries.map(([k, val]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
            >
              <span className="font-medium">{k}:</span> {val}
              <button
                type="button"
                onClick={() => remove(k)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          placeholder="attribute (e.g. color, size, weight)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="text-xs h-7"
        />
        <Input
          placeholder="value (e.g. Red, L, 250g)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="text-xs h-7"
        />
        <Button type="button" size="sm" variant="ghost" className="h-7" onClick={add} disabled={!newKey.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
