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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { formatNPR } from '@/lib/nepal'
import type { Order } from '@/lib/types'
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
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}
const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cod: Banknote,
  esewa: Wallet,
  khalti: Wallet,
}

export function AdminOrders() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/orders?${params}`)
      return res.json()
    },
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) => {
      const body: Record<string, string> = {}
      if (status) body.status = status
      if (paymentStatus) body.paymentStatus = paymentStatus
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Order updated')
    },
    onError: () => toast.error('Failed to update order'),
  })

  const orders = data?.orders ?? []

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
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 overflow-hidden">
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
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Customer</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">District</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Payment</th>
                  <th className="text-right font-medium px-4 py-3">Total</th>
                  <th className="text-right font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No orders yet. Orders placed from the storefront will appear here.
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
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="font-medium line-clamp-1">{o.customerName}</p>
                          <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {o.shippingDistrict}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[o.status]}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
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

              <div className="px-1 py-4 space-y-5">
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
                        {s}
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

                <Separator />

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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatNPR(selected.shippingCost)}</span>
                  </div>
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
              </div>

              <SheetFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.open(`tel:${selected.customerPhone}`)
                  }}
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
