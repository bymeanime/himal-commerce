'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatNPR } from '@/lib/nepal'
import { useUI } from '@/lib/ui-store'
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Truck,
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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export function AdminDashboard() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      return res.json()
    },
  })
  const setSection = useUI((s) => s.setAdminSection)

  if (isLoading || !data) {
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, Namaste! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

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

      {/* Chart + status row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Revenue — last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesByDay}>
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

      {/* Recent orders + top products */}
      <div className="grid lg:grid-cols-3 gap-4">
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
      </div>

      {/* Categories */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Catalog by category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
  )
}
