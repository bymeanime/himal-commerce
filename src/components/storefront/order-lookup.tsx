'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Package, Truck, CheckCircle2, Clock, XCircle, RotateCcw, Loader2, MapPin, CreditCard } from 'lucide-react'
import { formatNPR } from '@/lib/nepal'
import { toast } from 'sonner'
import Link from 'next/link'

type SafeOrderItem = {
  id: string
  title: string
  variantTitle: string | null
  thumbnail: string | null
  price: number
  quantity: number
}

type SafeOrderEvent = {
  type: string
  message: string
  actorKind: string
  createdAt: string
}

type SafeOrder = {
  id: string
  orderNumber: string
  status: string
  fulfillment: string
  customerName: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingZone: string
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  shippingCost: number
  taxTotal: number
  discountAmount: number
  total: number
  courier: string | null
  trackingNumber: string | null
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  refundedAt: string | null
  items: SafeOrderItem[]
  events: SafeOrderEvent[]
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', icon: XCircle },
  returned: { label: 'Returned', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300', icon: RotateCcw },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300', icon: CreditCard },
  on_hold: { label: 'On hold', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300', icon: Clock },
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery',
  esewa: 'eSewa',
  khalti: 'Khalti',
}

const COURIER_LABEL: Record<string, string> = {
  pathao: 'Pathao',
  nepal_can_move: 'Nepal Can Move',
  aramex: 'Aramex',
  fedex: 'FedEx',
  other: 'Courier',
}

export function OrderLookup({
  storeId,
  storeSlug,
  refundPolicyDays,
  returnPolicyText,
}: {
  storeId: string
  storeSlug: string
  refundPolicyDays: number
  returnPolicyText: string | null
}) {
  const [phone, setPhone] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<SafeOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnReasonCode, setReturnReasonCode] = useState('changed_mind')
  const [returnSubmitting, setReturnSubmitting] = useState(false)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !orderNumber) {
      toast.error('Please enter both phone number and order number')
      return
    }
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, phone, orderNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Order not found')
      } else {
        setOrder(data.order)
      }
    } catch {
      setError('Could not look up your order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReturn = async () => {
    if (!order) return
    if (!returnReason.trim()) {
      toast.error('Please describe the reason for your return')
      return
    }
    setReturnSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          storeId,
          reason: returnReason,
          reasonCode: returnReasonCode,
          itemsRequested: JSON.stringify(order.items.map((i) => ({ title: i.title, quantity: i.quantity }))),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not submit return request')
      } else {
        toast.success('Return request submitted — the store will be in touch soon.')
        setReturnDialogOpen(false)
        setReturnReason('')
        // Refresh the order to show the new event
        setOrder((prev) => prev ? {
          ...prev,
          events: [
            { type: 'return_requested', message: `Return requested: ${returnReason}`, actorKind: 'customer', createdAt: new Date().toISOString() },
            ...prev.events,
          ],
        } : prev)
      }
    } catch {
      toast.error('Could not submit return request')
    } finally {
      setReturnSubmitting(false)
    }
  }

  const canRequestReturn = order && ['delivered', 'shipped'].includes(order.status) && !['returned', 'refunded'].includes(order.status)

  return (
    <div className="space-y-6">
      {/* Lookup form */}
      <form onSubmit={handleLookup} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="98XXXXXXXX or +97798XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order number</Label>
            <Input
              id="orderNumber"
              type="text"
              placeholder="HC-1001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Looking up…
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" /> Find my order
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Tip: your order number was sent in your order confirmation. It starts with <code>HC-</code>.
        </p>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg p-4 text-sm text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Order details */}
      {order && (
        <OrderDetails
          order={order}
          storeSlug={storeSlug}
          refundPolicyDays={refundPolicyDays}
          returnPolicyText={returnPolicyText}
          canRequestReturn={!!canRequestReturn}
          onRequestReturn={() => setReturnDialogOpen(true)}
        />
      )}

      {/* Return dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a return</DialogTitle>
            <DialogDescription>
              Tell us why you&apos;d like to return items from order {order?.orderNumber}. The store will review your request and contact you within 1 business day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reasonCode">Reason</Label>
              <Select value={returnReasonCode} onValueChange={setReturnReasonCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="changed_mind">Changed my mind</SelectItem>
                  <SelectItem value="size">Wrong size / doesn&apos;t fit</SelectItem>
                  <SelectItem value="defective">Defective / damaged</SelectItem>
                  <SelectItem value="wrong_item">Wrong item received</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Details</Label>
              <Textarea
                id="reason"
                placeholder="Please describe the issue in detail so we can help you faster."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Return policy: {returnPolicyText || `${refundPolicyDays} days from delivery. Items must be unused and in original packaging.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReturn} disabled={returnSubmitting}>
              {returnSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
                </>
              ) : (
                'Submit return request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderDetails({
  order,
  storeSlug,
  refundPolicyDays,
  returnPolicyText,
  canRequestReturn,
  onRequestReturn,
}: {
  order: SafeOrder
  storeSlug: string
  refundPolicyDays: number
  returnPolicyText: string | null
  canRequestReturn: boolean
  onRequestReturn: () => void
}) {
  const meta = STATUS_META[order.status] || STATUS_META.pending
  const StatusIcon = meta.icon

  const created = new Date(order.createdAt)
  const formattedDate = created.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{order.orderNumber}</h2>
              <Badge className={meta.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {meta.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed {formattedDate} · {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod} ·{' '}
              <span className={order.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                {order.paymentStatus}
              </span>
            </p>
          </div>
          {canRequestReturn && (
            <Button variant="outline" size="sm" onClick={onRequestReturn}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Request return
            </Button>
          )}
        </div>
      </div>

      {/* Tracking banner */}
      {order.trackingNumber && (
        <div className="px-5 py-3 bg-indigo-50 dark:bg-indigo-950/30 border-b border-border flex items-center gap-3">
          <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="text-sm">
            <span className="text-muted-foreground">Shipped via {COURIER_LABEL[order.courier || 'other'] || order.courier}: </span>
            <span className="font-mono font-semibold">{order.trackingNumber}</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Items */}
        <div className="md:col-span-2 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Items</h3>
          {order.items.map((it) => (
            <div key={it.id} className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-md bg-secondary overflow-hidden shrink-0">
                {it.thumbnail ? (
                  <img src={it.thumbnail} alt={it.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{it.title}</p>
                {it.variantTitle && (
                  <p className="text-xs text-muted-foreground">{it.variantTitle}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Qty {it.quantity}</p>
              </div>
              <div className="text-sm font-semibold whitespace-nowrap">
                {formatNPR(it.price * it.quantity)}
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="pt-3 border-t border-border space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatNPR(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>−{formatNPR(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{order.shippingCost === 0 ? 'Free' : formatNPR(order.shippingCost)}</span>
            </div>
            {order.taxTotal > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>VAT (13%)</span>
                <span>{formatNPR(order.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-1 text-base">
              <span>Total</span>
              <span>{formatNPR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="p-5 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Shipping to</h3>
          <div className="text-sm space-y-0.5">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">{order.shippingAddress}</p>
            <p className="text-muted-foreground">
              {order.shippingCity}, {order.shippingDistrict}
            </p>
            <p className="text-muted-foreground">{order.shippingZone} Province</p>
          </div>

          <div className="pt-3 mt-3 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Need help?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {returnPolicyText
                ? returnPolicyText.slice(0, 120) + (returnPolicyText.length > 120 ? '…' : '')
                : `${refundPolicyDays}-day return policy from delivery date.`}
            </p>
            <Link
              href={`/s/${storeSlug}/contact`}
              className="text-sm text-primary hover:underline"
            >
              Contact the store →
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {order.events.length > 0 && (
        <div className="p-5 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order history</h3>
          <ol className="space-y-3">
            {order.events.map((ev, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">{ev.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ev.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    {ev.actorKind !== 'system' && ev.actorKind !== 'cron' && ` · by ${ev.actorKind}`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
