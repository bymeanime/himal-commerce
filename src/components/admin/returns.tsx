'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCurrentStore } from '@/lib/use-current-store'
import { formatNPR } from '@/lib/nepal'
import { RotateCcw, Check, X, Phone, Package, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

type ReturnRequest = {
  id: string
  orderId: string
  storeId: string
  reason: string
  reasonCode: string
  itemsRequested: string | null
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'exchanged'
  refundAmount: number | null
  refundMethod: string | null
  trackingNumber: string | null
  resolvedAt: string | null
  createdAt: string
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    total: number
    items: { id: string; title: string; variantTitle: string | null; quantity: number; price: number }[]
  }
}

const STATUS_FLOW: Record<ReturnRequest['status'], ReturnRequest['status'][]> = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  rejected: [],
  received: ['refunded', 'exchanged'],
  refunded: [],
  exchanged: [],
}

const STATUS_COLOR: Record<ReturnRequest['status'], string> = {
  requested: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  received: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  exchanged: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
}

const REASON_LABEL: Record<string, string> = {
  changed_mind: 'Changed mind',
  size: 'Wrong size / fit',
  defective: 'Defective / damaged',
  wrong_item: 'Wrong item received',
  other: 'Other',
}

export function AdminReturns() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [statusFilter, setStatusFilter] = useState<'requested' | 'all' | 'approved' | 'received' | 'rejected' | 'refunded'>('requested')
  const [resolveReturn, setResolveReturn] = useState<ReturnRequest | null>(null)

  const { data, isLoading } = useQuery<{ returns: ReturnRequest[] }>({
    queryKey: ['returns', storeId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ storeId: storeId! })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/returns?${params}`)
      return res.json()
    },
    enabled: !!storeId,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, refundAmount, refundMethod }: { id: string; status: string; refundAmount?: number; refundMethod?: string }) => {
      const res = await fetch('/api/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, storeId, status, refundAmount, refundMethod }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] })
      toast.success('Return updated')
      setResolveReturn(null)
    },
    onError: () => toast.error('Failed to update return'),
  })

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  const returns = data?.returns ?? []
  const requestedCount = returns.filter((r) => r.status === 'requested').length

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Returns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage customer return requests. Approve, reject, refund, or exchange items.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Show:</span>
        {(['requested', 'approved', 'received', 'refunded', 'rejected', 'all'] as const).map((s) => (
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

      {/* Returns list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : returns.length === 0 ? (
        <Card className="p-10 text-center">
          <RotateCcw className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold">
            {statusFilter === 'requested' ? 'No pending return requests' : 'No returns in this view'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === 'requested'
              ? 'When customers request returns from the order-lookup portal, they will appear here.'
              : 'Try a different status filter.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {returns.map((r) => (
            <ReturnCard
              key={r.id}
              ret={r}
              onResolve={() => setResolveReturn(r)}
            />
          ))}
        </div>
      )}

      {/* Resolve dialog */}
      {resolveReturn && (
        <ResolveDialog
          ret={resolveReturn}
          onOpenChange={(o) => !o && setResolveReturn(null)}
          onSubmit={(status, refundAmount, refundMethod) =>
            updateStatus.mutate({
              id: resolveReturn.id,
              status,
              refundAmount,
              refundMethod,
            })
          }
          submitting={updateStatus.isPending}
        />
      )}
    </div>
  )
}

function ReturnCard({ ret, onResolve }: { ret: ReturnRequest; onResolve: () => void }) {
  const nextStatuses = STATUS_FLOW[ret.status] || []
  const created = new Date(ret.createdAt)

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{ret.order.orderNumber}</h3>
            <Badge className={STATUS_COLOR[ret.status]}>{ret.status}</Badge>
            <Badge variant="outline" className="text-xs">
              {REASON_LABEL[ret.reasonCode] || ret.reasonCode}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Requested {created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{ret.order.customerName}</p>
          <a
            href={`tel:${ret.order.customerPhone}`}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-end gap-1"
          >
            <Phone className="h-3 w-3" /> {ret.order.customerPhone}
          </a>
        </div>
      </div>

      <div className="bg-secondary/40 rounded-lg p-3 text-sm">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
        <p className="text-foreground">{ret.reason}</p>
      </div>

      {ret.itemsRequested && (
        <div className="text-xs text-muted-foreground">
          <Package className="h-3 w-3 inline mr-1" />
          Items: {(() => {
            try {
              const items = JSON.parse(ret.itemsRequested)
              return Array.isArray(items) ? items.map((i: { title: string; quantity: number }) => `${i.title} ×${i.quantity}`).join(', ') : ret.itemsRequested
            } catch {
              return ret.itemsRequested
            }
          })()}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">Order total: {formatNPR(ret.order.total)}</span>
        {nextStatuses.length > 0 ? (
          <Button size="sm" onClick={onResolve}>
            Resolve →
          </Button>
        ) : (
          <Badge variant="outline">Resolved</Badge>
        )}
      </div>
    </Card>
  )
}

function ResolveDialog({
  ret,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  ret: ReturnRequest
  onOpenChange: (o: boolean) => void
  onSubmit: (status: string, refundAmount?: number, refundMethod?: string) => void
  submitting: boolean
}) {
  const nextStatuses = STATUS_FLOW[ret.status] || []
  const [selectedStatus, setSelectedStatus] = useState<string>(nextStatuses[0] || '')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundMethod, setRefundMethod] = useState('original')

  const needsRefund = selectedStatus === 'refunded'

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve return · {ret.order.orderNumber}</DialogTitle>
          <DialogDescription>
            Current status: <span className="font-medium capitalize">{ret.status}</span>. Choose the next step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-secondary/40 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Customer:</span> {ret.order.customerName}</p>
            <p><span className="text-muted-foreground">Reason:</span> {ret.reason}</p>
            <p><span className="text-muted-foreground">Order total:</span> {formatNPR(ret.order.total)}</p>
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {nextStatuses.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s === 'approved' && 'Approve (customer can ship back)'}
                    {s === 'rejected' && 'Reject'}
                    {s === 'received' && 'Mark as received'}
                    {s === 'refunded' && 'Issue refund'}
                    {s === 'exchanged' && 'Mark as exchanged'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsRefund && (
            <>
              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund amount (Rs)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={String(ret.order.total / 100)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Suggested: full order total ({formatNPR(ret.order.total)}).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Refund method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original payment method</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const amount = needsRefund && refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined
              onSubmit(selectedStatus, amount, needsRefund ? refundMethod : undefined)
            }}
            disabled={submitting || !selectedStatus || (needsRefund && !refundAmount)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
