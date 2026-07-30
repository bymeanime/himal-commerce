'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { formatNPR } from '@/lib/nepal'
import type { Order, OrderEvent } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'
import {
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Package,
  Banknote,
  Wallet,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  History,
  RotateCcw,
  DollarSign,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'on_hold'] as const
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
  returned: 'bg-gray-100 text-gray-800 border-gray-200',
  refunded: 'bg-pink-100 text-pink-800 border-pink-200',
}
const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cod: Banknote,
  esewa: Wallet,
  khalti: Wallet,
}

export function AdminOrders() {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [internalNote, setInternalNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundMethod, setRefundMethod] = useState('original')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState('')

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders', storeId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ storeId: storeId! })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/orders?${params}`)
      return res.json()
    },
    enabled: !!storeId,
  })

  // Fetch order events when an order is selected
  const { data: eventsData } = useQuery<{ events: OrderEvent[] }>({
    queryKey: ['order-events', selected?.id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${selected!.id}?include=events`)
      return res.json()
    },
    enabled: !!selected?.id,
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status?: string; paymentStatus?: string; internalNotes?: string; trackingNumber?: string; courier?: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['order-events'] })
      toast.success('Order updated')
    },
    onError: () => toast.error('Failed to update order'),
  })

  const refundMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selected!.id,
          storeId,
          amount: parseInt(refundAmount, 10),
          reason: refundReason,
          method: refundMethod,
          initiatedBy: 'admin',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order-events'] })
      toast.success('Refund issued')
      setRefundAmount('')
      setRefundReason('')
    },
    onError: (e) => toast.error('Refund failed', { description: (e as Error).message }),
  })

  const orders = data?.orders ?? []
  const events = eventsData?.events ?? []

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} {statusFilter !== 'all' && `(${statusFilter})`}.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: table */}
      <Card className="border-border/60 overflow-hidden hidden md:block">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Order</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">District</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">Payment</th>
                  <th className="text-right font-medium px-4 py-3">Total</th>
                  <th className="text-right font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const PayIcon = PAYMENT_ICONS[o.paymentMethod] ?? Banknote
                    return (
                      <tr
                        key={o.id}
                        className="border-t border-border/40 hover:bg-muted/30 cursor-pointer"
                        onClick={() => setSelected(o)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold">{o.orderNumber}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium line-clamp-1">{o.customerName}</p>
                          <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {o.shippingDistrict}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[o.status] ?? ''}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="flex items-center gap-1.5 text-xs">
                            <PayIcon className="h-3 w-3" />
                            <span className="capitalize">{o.paymentMethod}</span>
                            <Badge
                              variant="outline"
                              className={
                                o.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                              }
                            >
                              {o.paymentStatus}
                            </Badge>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{formatNPR(o.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(o) }}>
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </Card>
        ) : (
          orders.map((o) => {
            const PayIcon = PAYMENT_ICONS[o.paymentMethod] ?? Banknote
            return (
              <Card
                key={o.id}
                className="p-3 cursor-pointer active:bg-muted/50"
                onClick={() => setSelected(o)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[o.status] ?? ''}`}>
                    {o.status}
                  </span>
                </div>
                <p className="font-medium text-sm">{o.customerName}</p>
                <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <PayIcon className="h-3 w-3" /> {o.paymentMethod}
                    <Badge
                      variant="outline"
                      className={
                        o.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] ml-1'
                          : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px] ml-1'
                      }
                    >
                      {o.paymentStatus}
                    </Badge>
                  </span>
                  <span className="font-semibold text-sm">{formatNPR(o.total)}</span>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto nice-scroll">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selected.orderNumber}</SheetTitle>
                <SheetDescription>
                  Placed on {new Date(selected.createdAt).toLocaleString('en-IN')}
                </SheetDescription>
              </SheetHeader>

              <div className="px-1 py-4">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                    <TabsTrigger value="fulfillment" className="text-xs">Shipping</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">
                      <History className="h-3 w-3 mr-1" /> History
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Order details + status + items */}
                  <TabsContent value="details" className="space-y-4 mt-4">
                    {/* Status management */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_FLOW.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={selected.status === s ? 'default' : 'outline'}
                            onClick={() => {
                              updateMut.mutate({ id: selected.id, status: s })
                              setSelected({ ...selected, status: s })
                            }}
                            className="text-xs capitalize"
                          >
                            {s === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {s === 'processing' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {s === 'shipped' && <Truck className="h-3 w-3 mr-1" />}
                            {s === 'delivered' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {s === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                            {s === 'on_hold' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {s.replace('_', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Customer + shipping */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border p-3 space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
                        <p className="font-medium text-sm">{selected.customerName}</p>
                        <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {selected.customerPhone}
                        </p>
                        {selected.customerEmail && (
                          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {selected.customerEmail}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border p-3 space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping</p>
                        <p className="text-xs flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>
                            {selected.shippingAddress}<br />
                            {selected.shippingCity}, {selected.shippingDistrict}<br />
                            {selected.shippingZone} Province
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
                        <Button
                          size="sm"
                          variant={selected.paymentStatus === 'paid' ? 'secondary' : 'default'}
                          className="h-7 text-xs"
                          onClick={() => {
                            const next = selected.paymentStatus === 'paid' ? 'unpaid' : 'paid'
                            updateMut.mutate({ id: selected.id, paymentStatus: next })
                            setSelected({ ...selected, paymentStatus: next })
                          }}
                        >
                          Mark as {selected.paymentStatus === 'paid' ? 'unpaid' : 'paid'}
                        </Button>
                      </div>
                      <p className="text-sm font-medium capitalize">{selected.paymentMethod}</p>
                      <Badge
                        variant="outline"
                        className={
                          selected.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }
                      >
                        {selected.paymentStatus}
                      </Badge>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Items ({selected.items.length})
                      </p>
                      <div className="space-y-2">
                        {selected.items.map((it) => (
                          <div key={it.id} className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted">
                              {it.thumbnail && <img src={it.thumbnail} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{it.title}</p>
                              {it.variantTitle && (
                                <p className="text-xs text-muted-foreground">{it.variantTitle}</p>
                              )}
                              <p className="text-xs text-muted-foreground">{formatNPR(it.price)} × {it.quantity}</p>
                            </div>
                            <span className="text-sm font-semibold">{formatNPR(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatNPR(selected.subtotal)}</span>
                      </div>
                      {selected.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount</span>
                          <span>-{formatNPR(selected.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{formatNPR(selected.shippingCost)}</span>
                      </div>
                      {selected.taxTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT (13%)</span>
                          <span>{formatNPR(selected.taxTotal)}</span>
                        </div>
                      )}
                      <Separator className="my-1" />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-primary">{formatNPR(selected.total)}</span>
                      </div>
                    </div>

                    {selected.notes && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer notes</p>
                          <p className="text-sm text-foreground/80 italic">{selected.notes}</p>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Tab 2: Shipping / fulfillment */}
                  <TabsContent value="fulfillment" className="space-y-4 mt-4">
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Courier & tracking</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Courier</Label>
                          <Select value={courier || selected.courier || ''} onValueChange={setCourier}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pathao">Pathao</SelectItem>
                              <SelectItem value="nepal_can_move">Nepal Can Move</SelectItem>
                              <SelectItem value="aramex">Aramex</SelectItem>
                              <SelectItem value="fedex">FedEx</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tracking #</Label>
                          <Input
                            className="h-8 text-xs"
                            value={trackingNumber || selected.trackingNumber || ''}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="e.g. PN-12345"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updateMut.mutate({
                            id: selected.id,
                            courier: courier || undefined,
                            trackingNumber: trackingNumber || undefined,
                          })
                        }}
                        disabled={updateMut.isPending}
                      >
                        <Truck className="h-3.5 w-3.5 mr-1" /> Save tracking info
                      </Button>
                    </div>

                    {selected.trackingNumber && (
                      <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 p-3">
                        <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                          <Truck className="h-3.5 w-3.5 inline mr-1" />
                          Shipped via {selected.courier || courier || 'courier'} · {selected.trackingNumber || trackingNumber}
                        </p>
                        {selected.shippedAt && (
                          <p className="text-[10px] text-purple-700 dark:text-purple-400 mt-1">
                            Shipped on {new Date(selected.shippedAt).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Refund section */}
                    <div className="rounded-lg border p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-rose-600" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue refund</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Amount (paisa)</Label>
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={String(selected.total)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Method</Label>
                          <Select value={refundMethod} onValueChange={setRefundMethod}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="original">Original payment</SelectItem>
                              <SelectItem value="esewa">eSewa</SelectItem>
                              <SelectItem value="khalti">Khalti</SelectItem>
                              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reason</Label>
                        <Input
                          className="h-8 text-xs"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="e.g. Item damaged in transit"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (!refundAmount || !refundReason) {
                            toast.error('Amount and reason are required')
                            return
                          }
                          if (confirm(`Refund रू ${(parseInt(refundAmount, 10) / 100).toLocaleString('en-IN')} to ${selected.customerName}?`)) {
                            refundMut.mutate()
                          }
                        }}
                        disabled={refundMut.isPending}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        {refundMut.isPending ? 'Processing…' : 'Issue refund'}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Notes (internal + customer) */}
                  <TabsContent value="notes" className="space-y-4 mt-4">
                    {/* Internal notes */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Internal notes (staff only)
                      </p>
                      {selected.internalNotes && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-sm">
                          {selected.internalNotes}
                        </div>
                      )}
                      <Textarea
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Add a private note for staff (not visible to customer)…"
                        rows={4}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newNotes = internalNote.trim()
                          if (!newNotes) return
                          const combined = selected.internalNotes
                            ? `${selected.internalNotes}\n---\n[${new Date().toISOString().slice(0, 16)}]\n${newNotes}`
                            : `[${new Date().toISOString().slice(0, 16)}]\n${newNotes}`
                          updateMut.mutate({ id: selected.id, internalNotes: combined })
                          setSelected({ ...selected, internalNotes: combined })
                          setInternalNote('')
                        }}
                      >
                        Save internal note
                      </Button>
                    </div>

                    <Separator />

                    {/* Customer notes (read-only) */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> Customer notes
                      </p>
                      {selected.notes ? (
                        <div className="rounded-lg bg-muted/40 p-3 text-sm italic">
                          {selected.notes}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No customer notes.</p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 4: Order history (events timeline) */}
                  <TabsContent value="history" className="space-y-3 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Order timeline ({events.length} events)
                    </p>
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No events recorded yet. Status changes, refunds, and notes will appear here.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {events.map((ev, i) => (
                          <div key={ev.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`h-2 w-2 rounded-full mt-1.5 ${
                                ev.type === 'refund_issued' ? 'bg-rose-500' :
                                ev.type === 'return_requested' ? 'bg-orange-500' :
                                ev.type === 'status_change' ? 'bg-blue-500' :
                                ev.type === 'note_added' ? 'bg-amber-500' :
                                'bg-muted-foreground'
                              }`} />
                              {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
                            </div>
                            <div className="flex-1 pb-3">
                              <p className="text-xs text-muted-foreground">
                                {new Date(ev.createdAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' · '}
                                <span className="capitalize">{ev.actorKind}</span>
                              </p>
                              <p className="text-sm">{ev.message}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{ev.type}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <SheetFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`tel:${selected.customerPhone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" /> Call customer
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
