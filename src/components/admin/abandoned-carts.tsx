'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCurrentStore } from '@/lib/use-current-store'
import { formatNPR } from '@/lib/nepal'
import { HeartHandshake, Clock, TrendingUp, Phone, MessageCircle } from 'lucide-react'

type AbandonedCart = {
  id: string
  customerPhone: string | null
  customerEmail: string | null
  cartData: string
  cartValue: number
  recoveredAt: string | null
  firstReminderSentAt: string | null
  secondReminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

type Stats = {
  total: number
  recovered: number
  openValue: number
  recoveryRate: number
}

export function AdminAbandonedCarts() {
  const { storeId } = useCurrentStore()

  const { data, isLoading } = useQuery<{ carts: AbandonedCart[]; stats: Stats }>({
    queryKey: ['abandoned-carts', storeId],
    queryFn: async () => {
      const res = await fetch(`/api/abandoned-carts?storeId=${storeId}&recovered=false`)
      return res.json()
    },
    enabled: !!storeId,
  })

  if (!storeId) {
    return <div className="p-6 text-muted-foreground">No store selected.</div>
  }

  const carts = data?.carts ?? []
  const stats = data?.stats

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Abandoned Carts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Carts that started checkout but didn&apos;t complete. Reach out to recover lost sales.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <HeartHandshake className="h-3 w-3" /> Open carts
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total - stats.recovered}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="h-3 w-3" /> Open value
            </div>
            <p className="text-2xl font-bold mt-1">{formatNPR(stats.openValue)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3 w-3" /> Recovered
            </div>
            <p className="text-2xl font-bold mt-1">{stats.recovered}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="h-3 w-3" /> Recovery rate
            </div>
            <p className="text-2xl font-bold mt-1">{stats.recoveryRate}%</p>
          </Card>
        </div>
      )}

      {/* Cart list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : carts.length === 0 ? (
        <Card className="p-12 text-center">
          <HeartHandshake className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No abandoned carts right now. Nice work!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {carts.map((c) => {
            let items: { title: string; quantity: number; price: number }[] = []
            try {
              items = JSON.parse(c.cartData)
            } catch {
              // ignore parse errors
            }
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {c.customerPhone || c.customerEmail || 'Anonymous visitor'}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(c.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Badge>
                      {c.firstReminderSentAt && (
                        <Badge variant="secondary" className="text-[10px]">
                          1st reminder sent
                        </Badge>
                      )}
                      {c.secondReminderSentAt && (
                        <Badge variant="secondary" className="text-[10px]">
                          2nd reminder sent
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {items.length} {items.length === 1 ? 'item' : 'items'}: {' '}
                      {items.slice(0, 3).map((i) => i.title).join(', ')}
                      {items.length > 3 && ` +${items.length - 3} more`}
                    </div>
                    <p className="text-lg font-bold text-primary">{formatNPR(c.cartValue)}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {c.customerPhone && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8"
                          onClick={() => window.open(`tel:${c.customerPhone}`)}
                        >
                          <Phone className="h-3.5 w-3.5 mr-1" /> Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            const msg = `Namaste! We noticed you left some items in your cart at our store. Would you like to complete your order? Reply YES and we'll help you.`
                            window.open(`https://wa.me/977${c.customerPhone}?text=${encodeURIComponent(msg)}`)
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Automated recovery:</strong> A daily cron job runs at 9:00 AM (Nepal time)
          to send SMS reminders to customers with abandoned carts older than 2 hours.
          Configure the SparrowSMS token in Settings to enable automated recovery.
        </p>
      </Card>
    </div>
  )
}
