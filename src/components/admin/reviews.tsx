'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentStore } from '@/lib/use-current-store'
import { formatNPR } from '@/lib/nepal'
import { Star, Check, X, Clock, ThumbsUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { ProductReview } from '@/lib/types'

type ReviewWithProduct = ProductReview & {
  product: { title: string; slug: string; thumbnail: string | null }
}

export function AdminReviews() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data, isLoading } = useQuery<{ reviews: ReviewWithProduct[]; stats: { total: number; pending: number; average: number; distribution: number[] } }>({
    queryKey: ['reviews', storeId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ storeId: storeId! })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/reviews?${params}`)
      return res.json()
    },
    enabled: !!storeId,
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, status }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review updated')
    },
    onError: () => toast.error('Failed to update review'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews/${id}?storeId=${storeId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review deleted')
    },
    onError: () => toast.error('Failed to delete review'),
  })

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  const reviews = data?.reviews ?? []
  const stats = data?.stats

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Moderate customer reviews before they appear on your storefront.
        </p>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Star className="h-3 w-3" /> Average
            </div>
            <p className="text-2xl font-bold mt-1">{stats.average || '—'}</p>
            <p className="text-[10px] text-muted-foreground">{stats.total} approved</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3 w-3" /> Pending
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">awaiting review</p>
          </Card>
          {stats.distribution.map((count, i) => (
            <Card key={i} className="p-4 hidden md:block">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                {5 - i} star
              </div>
              <p className="text-2xl font-bold mt-1">{count}</p>
              <p className="text-[10px] text-muted-foreground">reviews</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'pending'
              ? 'No reviews pending moderation. New reviews from customers will appear here.'
              : 'No reviews to show.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                {/* Product thumbnail */}
                <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted">
                  {r.product.thumbnail && (
                    <img src={r.product.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{r.product.title}</p>
                    <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    {r.verified && (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                        <Check className="h-2.5 w-2.5 mr-0.5" /> Verified buyer
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      by {r.customerName} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.title && <p className="text-sm font-semibold">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2 justify-end">
                {r.status !== 'approved' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => updateMut.mutate({ id: r.id, status: 'approved' })}
                    disabled={updateMut.isPending}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                )}
                {r.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMut.mutate({ id: r.id, status: 'rejected' })}
                    disabled={updateMut.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Permanently delete this review?')) deleteMut.mutate(r.id)
                  }}
                  disabled={deleteMut.isPending}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
