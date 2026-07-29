'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatNPR } from '@/lib/nepal'
import { Search, Phone, Mail, MapPin, Users, ShoppingBag } from 'lucide-react'

type CustomerRow = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  createdAt: string
  orderCount: number
  totalSpent: number
  recentOrders: Array<{ total: number; status: string; createdAt: string }>
}

export function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerRow | null>(null)

  const { data, isLoading } = useQuery<{ customers: CustomerRow[] }>({
    queryKey: ['customers'],
    queryFn: async () => (await fetch('/api/customers')).json(),
  })

  const customers = (data?.customers ?? []).filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {customers.length} customers have ordered from your store.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
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
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Location</th>
                  <th className="text-right font-medium px-4 py-3">Orders</th>
                  <th className="text-right font-medium px-4 py-3">Total spent</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No customers yet.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-border/40 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {c.district ? `${c.city || ''}, ${c.district}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{c.orderCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">{formatNPR(c.totalSpent)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto nice-scroll">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>Customer since {new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</SheetDescription>
              </SheetHeader>
              <div className="px-1 py-4 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</p>
                    <p className="text-2xl font-bold">{selected.orderCount}</p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total spent</p>
                    <p className="text-2xl font-bold text-primary">{formatNPR(selected.totalSpent)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selected.phone}</p>
                  {selected.email && (
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selected.email}</p>
                  )}
                  {selected.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>
                        {selected.address}<br />
                        {selected.city}, {selected.district}
                      </span>
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" /> Recent orders
                  </p>
                  {selected.recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.recentOrders.map((o, i) => (
                        <div key={i} className="flex items-center justify-between text-sm rounded-md border p-2">
                          <div>
                            <Badge variant="outline" className="text-[10px] capitalize">{o.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <span className="font-semibold">{formatNPR(o.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
