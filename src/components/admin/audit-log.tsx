'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollText, Search, User, Cog, Globe, ShoppingCart, Package, FolderTree, Store } from 'lucide-react'
import { useCurrentStore } from '@/lib/use-current-store'

type AuditLog = {
  id: string
  storeId: string | null
  actorId: string | null
  actorKind: string
  action: string
  entityType: string
  entityId: string
  before: string | null
  after: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  order: ShoppingCart,
  product: Package,
  category: FolderTree,
  store: Store,
  customer: User,
}

const ACTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  system: Cog,
  anonymous: Globe,
  cron: Cog,
}

export function AdminAuditLog() {
  const { storeId } = useCurrentStore()
  const [entity, setEntity] = useState<string>('all')
  const [action, setAction] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ['audit-logs', storeId, entity, action],
    queryFn: async () => {
      if (!storeId) return { logs: [], total: 0 }
      const params = new URLSearchParams({ storeId, limit: '200' })
      if (entity !== 'all') params.set('entity', entity)
      if (action) params.set('action', action)
      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) return { logs: [], total: 0 }
      return res.json()
    },
    enabled: !!storeId,
  })

  const logs = data?.logs ?? []
  const filtered = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId.toLowerCase().includes(search.toLowerCase()) ||
        (l.actorId ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : logs

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-primary" />
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.total ?? 0} total entries · who changed what, when.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, entity ID, or actor ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="category">Categories</SelectItem>
            <SelectItem value="store">Store</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by action (e.g. order.update)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full sm:w-56"
        />
      </div>

      {/* Log entries */}
      <Card className="border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No audit log entries match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((log) => {
              const EntityIcon = ENTITY_ICONS[log.entityType] ?? ScrollText
              const ActorIcon = ACTOR_ICONS[log.actorKind] ?? User
              const before = log.before ? safeParse(log.before) : null
              const after = log.after ? safeParse(log.after) : null
              return (
                <div key={log.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <EntityIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          <ActorIcon className="h-2.5 w-2.5 mr-1" />
                          {log.actorKind}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {log.entityType}:{log.entityId.slice(0, 12)}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {log.actorId && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          actor: <code className="font-mono">{log.actorId}</code>
                          {log.ip && <span className="ml-3">ip: <code className="font-mono">{log.ip}</code></span>}
                        </p>
                      )}
                      {(before || after) && (
                        <div className="mt-2 grid sm:grid-cols-2 gap-2 text-[11px]">
                          {before && (
                            <div className="rounded border border-red-200 bg-red-50 dark:bg-red-950/20 p-2 font-mono break-all">
                              <div className="text-[10px] uppercase tracking-wider text-red-700 dark:text-red-300 mb-1">before</div>
                              <pre className="whitespace-pre-wrap text-[10px]">{before}</pre>
                            </div>
                          )}
                          {after && (
                            <div className="rounded border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-2 font-mono break-all">
                              <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">after</div>
                              <pre className="whitespace-pre-wrap text-[10px]">{after}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function safeParse(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}
