'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Star, Check, PenLine } from 'lucide-react'
import { toast } from 'sonner'

type Review = {
  id: string
  customerName: string
  rating: number
  title: string | null
  body: string | null
  verified: boolean
  createdAt: string
}

type Props = {
  productId: string
  storeId: string
  initialReviews?: Review[]
}

export function ProductReviews({ productId, storeId, initialReviews }: Props) {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    rating: 5,
    title: '',
    body: '',
  })

  const { data } = useQuery<{ reviews: Review[]; stats: { total: number; average: number; distribution: number[] } }>({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?storeId=${storeId}&productId=${productId}&status=approved`)
      return res.json()
    },
    initialData: initialReviews ? {
      reviews: initialReviews,
      stats: {
        total: initialReviews.length,
        average: initialReviews.length > 0
          ? Math.round((initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length) * 10) / 10
          : 0,
        distribution: [0, 0, 0, 0, 0],
      },
    } : undefined,
  })

  const submitMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          productId,
          customerName: form.customerName,
          customerPhone: form.customerPhone || undefined,
          rating: form.rating,
          title: form.title || undefined,
          body: form.body || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to submit review')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Review submitted!', {
        description: 'It will appear here after the store owner approves it.',
      })
      setDialogOpen(false)
      setForm({ customerName: '', customerPhone: '', rating: 5, title: '', body: '' })
      qc.invalidateQueries({ queryKey: ['product-reviews', productId] })
    },
    onError: (e) => toast.error('Failed to submit', { description: (e as Error).message }),
  })

  const reviews = data?.reviews ?? []
  const stats = data?.stats
  const hasReviews = reviews.length > 0

  return (
    <section className="mt-16 pt-8 border-t">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Customer reviews
          {hasReviews && <span className="text-muted-foreground ml-2 text-lg">({stats?.total})</span>}
        </h2>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          <PenLine className="h-4 w-4 mr-2" /> Write a review
        </Button>
      </div>

      {/* Rating summary */}
      {hasReviews && stats && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center md:border-r md:border-border/60 md:pr-6">
            <p className="text-5xl font-bold">{stats.average}</p>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i <= Math.round(stats.average) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.total} reviews</p>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            {stats.distribution.slice().reverse().map((count, i) => {
              const stars = 5 - i
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-muted-foreground">{stars} star</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Review list */}
      {hasReviews ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                {r.verified && (
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                    <Check className="h-2.5 w-2.5 mr-0.5" /> Verified buyer
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium">{r.customerName}</p>
              {r.title && <p className="text-sm font-semibold mt-1">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
              <p className="text-[10px] text-muted-foreground mt-2">
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

      {/* Review submission dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
            <DialogDescription>
              Share your honest experience. Reviews are moderated before they appear publicly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, rating: i })}
                    className="p-1"
                    aria-label={`${i} stars`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        i <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rev-name">Your name *</Label>
                <Input
                  id="rev-name"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="e.g. Ram Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rev-phone">Phone (for verified badge)</Label>
                <Input
                  id="rev-phone"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="98XXXXXXXX"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rev-title">Title</Label>
              <Input
                id="rev-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Summarize your experience"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rev-body">Review</Label>
              <Textarea
                id="rev-body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="What did you like or dislike? How was the quality?"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!form.customerName.trim()) {
                  toast.error('Please enter your name')
                  return
                }
                submitMut.mutate()
              }}
              disabled={submitMut.isPending}
            >
              {submitMut.isPending ? 'Submitting…' : 'Submit review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
