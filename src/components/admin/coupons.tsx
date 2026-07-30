'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCurrentStore } from '@/lib/use-current-store'
import { formatNPR } from '@/lib/nepal'
import { Ticket, Plus, Trash2, Power, Calendar, TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Coupon = {
  id: string
  storeId: string
  code: string
  type: 'percent' | 'fixed' | 'free_shipping'
  value: number
  minSubtotal: number | null
  maxRedemptions: number | null
  perCustomerLimit: number | null
  startsAt: string | null
  endsAt: string | null
  status: 'active' | 'paused' | 'expired'
  usageCount: number
  createdAt: string
}

const TYPE_LABEL: Record<Coupon['type'], string> = {
  percent: '% off',
  fixed: 'Flat off',
  free_shipping: 'Free shipping',
}

const STATUS_COLOR: Record<Coupon['status'], string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  expired: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400',
}

export function AdminCoupons() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'paused' | 'expired'>('active')
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ['coupons', storeId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ storeId: storeId!, status: statusFilter })
      const res = await fetch(`/api/coupons?${params}`)
      return res.json()
    },
    enabled: !!storeId,
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['coupons'] })
      toast.success(`Coupon ${vars.currentStatus === 'active' ? 'paused' : 'activated'}`)
    },
    onError: () => toast.error('Failed to update coupon'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coupons/${id}?storeId=${storeId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon deleted')
    },
    onError: () => toast.error('Failed to delete coupon'),
  })

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  const coupons = data?.coupons ?? []

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create discount codes for promotions, influencers, and affiliates.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New coupon
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        {(['active', 'all', 'paused', 'expired'] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'secondary' : 'ghost'}
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Coupon list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : coupons.length === 0 ? (
        <Card className="p-10 text-center">
          <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No coupons yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first discount code to start running promotions.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create coupon
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {coupons.map((c) => (
            <CouponCard
              key={c.id}
              coupon={c}
              onToggle={() => toggleStatus.mutate({ id: c.id, currentStatus: c.status })}
              onDelete={() => deleteMut.mutate(c.id)}
              isToggling={toggleStatus.isPending}
              isDeleting={deleteMut.isPending}
            />
          ))}
        </div>
      )}

      <CreateCouponDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        storeId={storeId}
        onCreated={() => {
          setCreateOpen(false)
          qc.invalidateQueries({ queryKey: ['coupons'] })
        }}
      />
    </div>
  )
}

function CouponCard({
  coupon,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  coupon: Coupon
  onToggle: () => void
  onDelete: () => void
  isToggling: boolean
  isDeleting: boolean
}) {
  const isExpired = !!(coupon.endsAt && new Date(coupon.endsAt) < new Date())
  const isScheduled = !!(coupon.startsAt && new Date(coupon.startsAt) > new Date())
  const usageLeft = coupon.maxRedemptions ? coupon.maxRedemptions - coupon.usageCount : null

  return (
    <Card className="p-4 flex flex-wrap items-center gap-4">
      {/* Code + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="font-mono font-bold text-lg tracking-wider bg-secondary/60 px-2 py-0.5 rounded">
            {coupon.code}
          </code>
          <Badge className={STATUS_COLOR[isExpired ? 'expired' : coupon.status]}>
            {isExpired ? 'expired' : coupon.status}
          </Badge>
          {isScheduled && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" /> scheduled
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {coupon.type === 'percent' && `${(coupon.value / 100).toFixed(1)}% off`}
          {coupon.type === 'fixed' && `${formatNPR(coupon.value)} off`}
          {coupon.type === 'free_shipping' && 'Free shipping'}
          {coupon.minSubtotal && ` · min ${formatNPR(coupon.minSubtotal)}`}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {coupon.usageCount} redemptions
            {usageLeft !== null && ` · ${usageLeft} left`}
          </span>
          {coupon.startsAt && (
            <span>Starts {new Date(coupon.startsAt).toLocaleDateString()}</span>
          )}
          {coupon.endsAt && (
            <span>Ends {new Date(coupon.endsAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          disabled={isToggling || isExpired}
          title={coupon.status === 'active' ? 'Pause' : 'Activate'}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  )
}

function CreateCouponDialog({
  open,
  onOpenChange,
  storeId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  storeId: string
  onCreated: () => void
}) {
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed' | 'free_shipping'>('percent')
  const [value, setValue] = useState('')
  const [minSubtotal, setMinSubtotal] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setCode(''); setType('percent'); setValue(''); setMinSubtotal('')
    setMaxRedemptions(''); setStartsAt(''); setEndsAt('')
  }

  const handleSubmit = async () => {
    if (!code) {
      toast.error('Coupon code is required')
      return
    }
    if (type !== 'free_shipping' && !value) {
      toast.error('Discount value is required')
      return
    }
    setSubmitting(true)
    try {
      // Convert UI value to API value:
      // - percent: user enters "10" (means 10%) → API wants bps (1000)
      // - fixed: user enters "100" (means Rs 100) → API wants paisa (10000)
      // - free_shipping: ignored
      let apiValue = 0
      if (type === 'percent') {
        apiValue = Math.round(parseFloat(value) * 100)
      } else if (type === 'fixed') {
        apiValue = Math.round(parseFloat(value) * 100)
      }

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          code: code.toUpperCase().trim(),
          type,
          value: apiValue,
          minSubtotal: minSubtotal ? Math.round(parseFloat(minSubtotal) * 100) : undefined,
          maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : undefined,
          startsAt: startsAt || undefined,
          endsAt: endsAt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create coupon')
      } else {
        toast.success(`Coupon ${code.toUpperCase()} created`)
        reset()
        onCreated()
      }
    } catch {
      toast.error('Failed to create coupon')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
          <DialogDescription>
            Discount codes are uppercase, alphanumeric, and unique per store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon code</Label>
            <Input
              id="code"
              placeholder="SUMMER20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={30}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Letters and numbers only.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage off</SelectItem>
                  <SelectItem value="fixed">Flat amount off</SelectItem>
                  <SelectItem value="free_shipping">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type !== 'free_shipping' && (
              <div className="space-y-2">
                <Label htmlFor="value">
                  {type === 'percent' ? 'Percent off (%)' : 'Amount off (Rs)'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step={type === 'percent' ? '1' : '0.01'}
                  min="0"
                  placeholder={type === 'percent' ? '10' : '100'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="minSubtotal">Min subtotal (Rs)</Label>
              <Input
                id="minSubtotal"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRedemptions">Max redemptions</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min="1"
                placeholder="Optional"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Starts at</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">Ends at</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Create coupon
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
