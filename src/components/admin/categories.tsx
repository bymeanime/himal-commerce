'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'
import { Plus, Pencil, Trash2, FolderTree, Image as ImageIcon } from 'lucide-react'
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

const ICON_OPTIONS = [
  'shirt', 'hammer', 'home', 'gem', 'book', 'leaf', 'package',
  'gift', 'cup-soda', 'tag', 'sparkles', 'box',
]

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

export function AdminCategories() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<(Category & { _count?: { products: number } }) | null>(null)

  const { data, isLoading } = useQuery<{ categories: (Category & { _count?: { products: number } })[] }>({
    queryKey: ['categories', storeId],
    queryFn: async () => (await fetch(`/api/categories?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })

  const categories = data?.categories ?? []

  const createMut = useMutation({
    mutationFn: async (body: Partial<Category>) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, storeId }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Create failed' }))
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created')
      setCreating(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Category> }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Update failed' }))
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category updated')
      setEditing(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) => {
      const url = `/api/categories/${id}${force ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Delete failed' }))
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category deleted')
      setDeleting(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your products into categories. Shoppers see these in the storefront navigation.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-10 text-center">
          <FolderTree className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No categories yet. Create your first one to start organizing products.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{c.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">/{c.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {c.description && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {c._count?.products ?? 0} product{(c._count?.products ?? 0) === 1 ? '' : 's'}
                </Badge>
                {c.icon && <Badge variant="outline" className="text-[10px]">{c.icon}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CategoryFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={(body) => createMut.mutate(body)}
        submitting={createMut.isPending}
        categories={categories}
        title="New category"
        description="Add a new category to organize your products."
      />

      {/* Edit sheet */}
      <CategoryFormSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        category={editing}
        onSubmit={(body) => editing && updateMut.mutate({ id: editing.id, body })}
        submitting={updateMut.isPending}
        categories={categories}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {(deleting?._count?.products ?? 0) > 0 ? (
                <>
                  This category has <strong>{deleting?._count?.products} product(s)</strong> attached.
                  Deleting it will leave those products uncategorized. They will still be visible in your store.
                </>
              ) : (
                <>This will permanently delete the category. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMut.mutate({ id: deleting.id, force: true })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CategoryFormFields({
  form,
  setForm,
  categories,
}: {
  form: Partial<Category>
  setForm: (f: Partial<Category>) => void
  categories: Category[]
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cat-name">Name</Label>
        <Input
          id="cat-name"
          value={form.name ?? ''}
          onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug ?? slugify(e.target.value) })}
          placeholder="e.g. Home & Decor"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-slug">Slug</Label>
        <Input
          id="cat-slug"
          value={form.slug ?? ''}
          onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
          placeholder="home-decor"
          className="font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Used in the storefront URL. Auto-generated from name; edit only if needed.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea
          id="cat-desc"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description shown on the category page (optional)"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cat-icon">Icon</Label>
          <Select
            value={form.icon ?? ''}
            onValueChange={(v) => setForm({ ...form, icon: v === 'none' ? null : v })}
          >
            <SelectTrigger id="cat-icon">
              <SelectValue placeholder="Pick an icon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— none —</SelectItem>
              {ICON_OPTIONS.map((ic) => (
                <SelectItem key={ic} value={ic}>{ic}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-parent">Parent category</Label>
          <Select
            value={form.parentId ?? 'none'}
            onValueChange={(v) => setForm({ ...form, parentId: v === 'none' ? null : v })}
          >
            <SelectTrigger id="cat-parent">
              <SelectValue placeholder="None (top-level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {categories
                .filter((c) => c.id !== form.id)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-image">Image URL</Label>
        <div className="flex gap-2">
          <Input
            id="cat-image"
            value={form.imageUrl ?? ''}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://… (optional banner image for the category page)"
          />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="" className="h-9 w-9 rounded object-cover" />
          )}
          {!form.imageUrl && (
            <div className="h-9 w-9 rounded grid place-items-center bg-muted text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  categories,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (body: Partial<Category>) => void
  submitting: boolean
  categories: Category[]
  title: string
  description: string
}) {
  const [form, setForm] = useState<Partial<Category>>({ name: '', slug: '', description: '', icon: null, imageUrl: '', parentId: null })

  // Reset form when dialog closes
  const handleClose = (o: boolean) => {
    if (!o) setForm({ name: '', slug: '', description: '', icon: null, imageUrl: '', parentId: null })
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CategoryFormFields form={form} setForm={setForm} categories={categories} />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button
            disabled={!form.name || !form.slug || submitting}
            onClick={() => onSubmit(form)}
          >
            {submitting ? 'Creating…' : 'Create category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryFormSheet({
  open,
  onOpenChange,
  category,
  onSubmit,
  submitting,
  categories,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  category: Category | null
  onSubmit: (body: Partial<Category>) => void
  submitting: boolean
  categories: Category[]
}) {
  const [form, setForm] = useState<Partial<Category>>({})

  // Sync form when category changes
  useState(() => {
    if (category) setForm(category)
  })
  // Also sync on open
  if (open && category && form.id !== category.id) {
    setForm(category)
  }

  if (!category) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit category</SheetTitle>
          <SheetDescription>Update the category details below.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <CategoryFormFields form={form} setForm={setForm} categories={categories} />
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!form.name || !form.slug || submitting}
            onClick={() => onSubmit(form)}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
