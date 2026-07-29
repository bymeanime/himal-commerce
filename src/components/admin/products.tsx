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
import { Plus, Search, Pencil, Trash2, Package, MapPin, Hammer, Eye, EyeOff } from 'lucide-react'
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
    origin: '',
    isHandmade: false,
    status: 'published',
    categoryId: '',
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
          categoryId: form.categoryId || null,
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
    origin: product.origin || '',
    isHandmade: product.isHandmade,
    status: product.status,
    categoryId: product.categoryId || '',
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
          categoryId: form.categoryId || null,
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
function ProductForm({
  form,
  setForm,
  categories,
}: {
  form: Record<string, string | boolean>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string | boolean>>>
  categories: Category[]
}) {
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

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
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Origin (district)</Label>
          <Input value={form.origin as string} onChange={(e) => set('origin', e.target.value)} placeholder="Palpa" />
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
    </div>
  )
}
