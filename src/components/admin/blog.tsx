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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { BlogPost } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'
import { Plus, Pencil, Trash2, Eye, FileText, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export function AdminBlog() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<BlogPost | null>(null)

  const { data, isLoading } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ['blog', storeId],
    queryFn: async () => (await fetch(`/api/blog?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })

  const posts = data?.posts ?? []

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog'] })
      toast.success('Post deleted')
      setDeleting(null)
    },
  })

  const totalViews = posts.reduce((s, p) => s + (p.viewCount ?? 0), 0)
  const publishedCount = posts.filter(p => p.status === 'published').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Blog</h2>
          <p className="text-sm text-muted-foreground">
            Long-form content for SEO — artisan stories, guides, brand storytelling.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Total posts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalViews}</p>
              <p className="text-xs text-muted-foreground">Total views</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No blog posts yet.</p>
          <Button onClick={() => setCreating(true)} className="mt-4" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Write your first post
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4 flex items-center gap-4">
              {post.coverImage ? (
                <img src={post.coverImage} alt="" className="h-14 w-14 rounded-md object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-md bg-muted grid place-items-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{post.title}</p>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>/blog/{post.slug}</span>
                  {post.author && <span>· {post.author}</span>}
                  <span>· <Eye className="inline h-3 w-3" /> {post.viewCount}</span>
                  <span>· <Clock className="inline h-3 w-3" /> {post.readingMinutes}m</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(post)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(post)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {creating && (
        <BlogEditor
          open={creating}
          onOpenChange={setCreating}
          storeId={storeId!}
          post={null}
        />
      )}

      {/* Edit sheet */}
      {editing && (
        <BlogEditor
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          storeId={storeId!}
          post={editing}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the post. This action cannot be undone.
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

function BlogEditor({
  open,
  onOpenChange,
  storeId,
  post,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  storeId: string
  post: BlogPost | null
}) {
  const qc = useQueryClient()
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '')
  const [author, setAuthor] = useState(post?.author ?? '')
  const [tags, setTags] = useState(post?.tags ? JSON.parse(post.tags).join(', ') : '')
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(post?.status ?? 'draft')

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title, slug: slug || slugify(title), excerpt, body, coverImage,
        author, tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
        metaTitle, metaDescription, status,
      }
      if (post) {
        const res = await fetch(`/api/blog/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({ error: 'Update failed' }))
          throw new Error(e.error)
        }
        return res.json()
      } else {
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, storeId }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({ error: 'Create failed' }))
          throw new Error(e.error)
        }
        return res.json()
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog'] })
      toast.success(post ? 'Post updated' : 'Post created')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto nice-scroll">
        <SheetHeader>
          <SheetTitle>{post ? 'Edit post' : 'New blog post'}</SheetTitle>
          <SheetDescription>
            {post ? `Editing "${post.title}"` : 'Write an SEO-optimized post. Use Markdown for formatting.'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-8 space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!post) setSlug(slugify(e.target.value))
              }}
              placeholder="Behind the Loom: A Day with Palpa's Master Weavers"
            />
          </div>

          <div>
            <Label htmlFor="slug">URL slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="behind-the-loom-palpa-weavers"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Will be visible at /blog/{slug || 'your-slug'}
            </p>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One-sentence summary shown in blog listings and meta description."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="body">Body (Markdown) *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={'# Heading\n\nWrite your story here. Use **bold**, *italic*, [links](url), and ![images](url).\n\n- Bullet points\n- Another point'}
              rows={14}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Markdown supported. Reading time auto-calculated.
            </p>
          </div>

          <div>
            <Label htmlFor="cover">Cover image URL</Label>
            <Input
              id="cover"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Sita Sharma"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="artisans, weaving, palpa"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published' | 'archived')}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (not visible)</SelectItem>
                <SelectItem value="published">Published (live)</SelectItem>
                <SelectItem value="archived">Archived (hidden from listings)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">SEO (optional)</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="metaTitle">Meta title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Custom title for search engines (defaults to post title)"
                />
              </div>
              <div>
                <Label htmlFor="metaDesc">Meta description</Label>
                <Textarea
                  id="metaDesc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Custom description for search engines (defaults to excerpt)"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={!title.trim() || !body.trim() || saveMut.isPending}
          >
            {saveMut.isPending ? 'Saving…' : post ? 'Save changes' : 'Create post'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
