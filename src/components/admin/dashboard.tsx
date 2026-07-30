'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNPR } from '@/lib/nepal'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Truck,
  Star,
  AlertTriangle,
  HeartHandshake,
  RotateCcw,
  Eye,
  MousePointerClick,
  ShoppingCart as CartIcon,
  CheckCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import Link from 'next/link'

type Stats = {
  totals: {
    orders: number
    products: number
    customers: number
    pendingOrders: number
    deliveredOrders: number
    revenue: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
    total: number
    customerName: string
    createdAt: string
  }>
  topProducts: Array<{ title: string; thumbnail: string | null; quantitySold: number }>
  salesByDay: Array<{ date: string; revenue: number; orders: number }>
  categories: Array<{ name: string; productCount: number }>
}

type Dashboard = {
  funnel: {
    page_view: number
    product_view: number
    add_to_cart: number
    checkout_start: number
    checkout_complete: number
    checkout_abandon: number
    search: number
  }
  conversionRate: number
  cartAbandonRate: number
  salesByDay: Array<{ date: string; revenue: number; orders: number; views: number }>
  lowStockProducts: Array<{
    id: string
    title: string
    slug: string
    thumbnail: string | null
    inventory: number
    lowStockThreshold: number
    sku: string | null
  }>
  pendingReviews: Array<{
    id: string
    customerName: string
    rating: number
    title: string | null
    product: { title: string; slug: string; thumbnail: string | null }
  }>
  abandonedCarts: { count: number; totalValue: number }
  pendingReturns: number
  range: number
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
}

export function AdminDashboard() {
  const { storeId, store } = useCurrentStore()
  const { data: statsData, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['stats', storeId],
    queryFn: async () => {
      const res = await fetch(`/api/stats?storeId=${storeId}`)
      return res.json()
    },
    enabled: !!storeId,
  })
  const { data: dashData, isLoading: dashLoading } = useQuery<Dashboard>({
    queryKey: ['dashboard', storeId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?storeId=${storeId}&range=7d`)
      return res.json()
    },
    enabled: !!storeId,
  })
  const setSection = useUI((s) => s.setAdminSection)

  const isLoading = statsLoading || dashLoading
  if (isLoading || !statsData || !dashData || !storeId) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  const data = statsData
  const dash = dashData

  const cards = [
    {
      label: 'Total Revenue',
      value: formatNPR(data.totals.revenue),
      icon: TrendingUp,
      hint: 'From paid orders',
    },
    {
      label: 'Orders',
      value: String(data.totals.orders),
      icon: ShoppingCart,
      hint: `${data.totals.pendingOrders} pending`,
    },
    {
      label: 'Customers',
      value: String(data.totals.customers),
      icon: Users,
      hint: 'Across Nepal',
    },
    {
      label: 'Products',
      value: String(data.totals.products),
      icon: Package,
      hint: 'Live in catalog',
    },
  ]

  // Funnel steps for the conversion visualization
  const funnelSteps = [
    { label: 'Page views', value: dash.funnel.page_view, icon: Eye, color: 'text-blue-600' },
    { label: 'Product views', value: dash.funnel.product_view, icon: Eye, color: 'text-indigo-600' },
    { label: 'Add to cart', value: dash.funnel.add_to_cart, icon: CartIcon, color: 'text-amber-600' },
    { label: 'Checkout started', value: dash.funnel.checkout_start, icon: MousePointerClick, color: 'text-purple-600' },
    { label: 'Orders placed', value: dash.funnel.checkout_complete, icon: CheckCircle, color: 'text-emerald-600' },
  ]
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1)

  // Action items that need attention
  const actionItems = [
    ...(dash.lowStockProducts.length > 0 ? [{
      icon: AlertTriangle,
      label: `${dash.lowStockProducts.length} products low on stock`,
      section: 'products' as const,
      color: 'text-amber-600',
    }] : []),
    ...(dash.pendingReviews.length > 0 ? [{
      icon: Star,
      label: `${dash.pendingReviews.length} reviews awaiting moderation`,
      section: 'reviews' as const,
      color: 'text-blue-600',
    }] : []),
    ...(dash.abandonedCarts.count > 0 ? [{
      icon: HeartHandshake,
      label: `${dash.abandonedCarts.count} abandoned carts (${formatNPR(dash.abandonedCarts.totalValue)})`,
      section: 'abandoned' as const,
      color: 'text-rose-600',
    }] : []),
    ...(dash.pendingReturns > 0 ? [{
      icon: RotateCcw,
      label: `${dash.pendingReturns} return requests pending`,
      section: 'orders' as const,
      color: 'text-orange-600',
    }] : []),
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {store?.name} — last 7 days overview
        </p>
      </div>

      {/* Action items banner */}
      {actionItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
              Needs your attention
            </p>
            <div className="space-y-1.5">
              {actionItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSection(item.section)}
                  className="flex items-center gap-2 text-sm hover:underline w-full text-left"
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.label}</span>
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {c.label}
                </span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                  <c.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mt-2 tracking-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion funnel */}
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Conversion funnel</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dash.conversionRate}% checkout conversion · {dash.cartAbandonRate}% cart abandonment
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnelSteps.map((step, i) => {
            const pct = maxFunnel > 0 ? (step.value / maxFunnel) * 100 : 0
            const stepPct = i > 0 && funnelSteps[i - 1].value > 0
              ? Math.round((step.value / funnelSteps[i - 1].value) * 100)
              : 100
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-32 shrink-0 flex items-center gap-2 text-xs">
                  <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
                  <span className="text-muted-foreground">{step.label}</span>
                </div>
                <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden relative">
                  <div
                    className={`h-full ${
                      i === 0 ? 'bg-blue-400' :
                      i === 1 ? 'bg-indigo-400' :
                      i === 2 ? 'bg-amber-400' :
                      i === 3 ? 'bg-purple-400' :
                      'bg-emerald-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                    {step.value.toLocaleString()}
                    {i > 0 && (
                      <span className="ml-auto text-muted-foreground">
                        {stepPct}% of previous
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Chart + status row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Revenue — last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dash.salesByDay}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.49 0.21 25)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="oklch(0.49 0.21 25)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 50)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="oklch(0.5 0 0)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="oklch(0.5 0 0)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `रू ${(v / 100).toLocaleString('en-IN')}`}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.91 0.01 50)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(v: number) => [formatNPR(v), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.49 0.21 25)"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Order status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" /> Pending
              </span>
              <span className="font-semibold">{data.totals.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-purple-600" /> Shipped
              </span>
              <span className="font-semibold">
                {data.recentOrders.filter((o) => o.status === 'shipped').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Delivered
              </span>
              <span className="font-semibold">{data.totals.deliveredOrders}</span>
            </div>
            <button
              onClick={() => setSection('orders')}
              className="text-xs text-primary hover:underline flex items-center gap-1 pt-2"
            >
              View all orders <ArrowRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alerts + recent orders */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Low stock */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Low stock
            </CardTitle>
            <button
              onClick={() => setSection('products')}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {dash.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">
                All products well stocked.
              </p>
            ) : (
              dash.lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md overflow-hidden bg-muted shrink-0">
                    {p.thumbnail && <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.inventory} left (threshold: {p.lowStockThreshold})
                    </p>
                  </div>
                  <Badge variant={p.inventory === 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                    {p.inventory === 0 ? 'Out' : 'Low'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <button
              onClick={() => setSection('orders')}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Order</th>
                    <th className="text-left font-medium px-4 py-2.5 hidden sm:table-cell">Customer</th>
                    <th className="text-left font-medium px-4 py-2.5">Status</th>
                    <th className="text-right font-medium px-4 py-2.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border/40 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell truncate max-w-32">{o.customerName}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[o.status] || ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">{formatNPR(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top sellers + categories */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Top sellers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={p.title} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md overflow-hidden bg-muted shrink-0">
                  {p.thumbnail && <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.quantitySold} sold</p>
                </div>
                <Badge variant="outline" className="text-[10px]">#{i + 1}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Catalog by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {data.categories.map((c) => (
                <div key={c.name} className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">{c.name}</p>
                  <p className="text-xl font-bold">{c.productCount}</p>
                  <p className="text-[10px] text-muted-foreground">products</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
