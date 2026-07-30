'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Influencer, Affiliate } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'
import { Plus, Trash2, Users, DollarSign, MousePointerClick, TrendingUp, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatNPR } from '@/lib/nepal'

export function AdminMarketing() {
  const { storeId } = useCurrentStore()
  const [tab, setTab] = useState<'influencers' | 'affiliates'>('influencers')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Marketing</h2>
        <p className="text-sm text-muted-foreground">
          Influencer + affiliate program management. Track conversions, manage commissions, attribute revenue.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'influencers' | 'affiliates')}>
        <TabsList>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
        </TabsList>
        <TabsContent value="influencers" className="mt-4">
          <InfluencersTab storeId={storeId!} />
        </TabsContent>
        <TabsContent value="affiliates" className="mt-4">
          <AffiliatesTab storeId={storeId!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfluencersTab({ storeId }: { storeId: string }) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent')
  const [commissionValue, setCommissionValue] = useState(1000) // 10% default

  const { data, isLoading } = useQuery<{ influencers: Influencer[] }>({
    queryKey: ['influencers', storeId],
    queryFn: async () => (await fetch(`/api/influencers?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })
  const influencers = data?.influencers ?? []

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId, name, handle, email, phone,
          commissionType, commissionValue,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Failed' }))
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['influencers'] })
      toast.success('Influencer added')
      setCreating(false)
      setName(''); setHandle(''); setEmail(''); setPhone('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/influencers/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['influencers'] })
      toast.success('Removed')
    },
  })

  const totalConversions = influencers.reduce((s, i) => s + i.conversions, 0)
  const totalRevenue = influencers.reduce((s, i) => s + i.revenue, 0)
  const totalCommission = influencers.reduce((s, i) => s + i.commissionEarned, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-3">
          <Users className="h-4 w-4 text-primary mb-1" />
          <p className="text-xl font-bold">{influencers.length}</p>
          <p className="text-xs text-muted-foreground">Influencers</p>
        </Card>
        <Card className="p-3">
          <MousePointerClick className="h-4 w-4 text-blue-600 mb-1" />
          <p className="text-xl font-bold">{totalConversions}</p>
          <p className="text-xs text-muted-foreground">Conversions</p>
        </Card>
        <Card className="p-3">
          <TrendingUp className="h-4 w-4 text-emerald-600 mb-1" />
          <p className="text-xl font-bold">{formatNPR(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Revenue</p>
        </Card>
        <Card className="p-3">
          <DollarSign className="h-4 w-4 text-amber-600 mb-1" />
          <p className="text-xl font-bold">{formatNPR(totalCommission)}</p>
          <p className="text-xs text-muted-foreground">Commission earned</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add influencer
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : influencers.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-sm text-muted-foreground">No influencers yet. Add your first one to start tracking.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {influencers.map((inf) => (
            <Card key={inf.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{inf.name}</p>
                    {inf.handle && <span className="text-xs text-muted-foreground">{inf.handle}</span>}
                    <Badge variant={inf.status === 'active' ? 'default' : 'secondary'}>
                      {inf.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs bg-secondary px-2 py-0.5 rounded">
                      ?ref={inf.code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`?ref=${inf.code}`)
                        toast.success('Referral code copied')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="inline h-3 w-3" /> copy
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {inf.commissionType === 'percent'
                        ? `${(inf.commissionValue / 100).toFixed(1)}% commission`
                        : `${formatNPR(inf.commissionValue)} per conversion`}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm font-semibold">{inf.clicks}</p>
                    <p className="text-[10px] text-muted-foreground">Clicks</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{inf.conversions}</p>
                    <p className="text-[10px] text-muted-foreground">Conv.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatNPR(inf.revenue)}</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatNPR(inf.commissionEarned)}</p>
                    <p className="text-[10px] text-muted-foreground">Earned</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMut.mutate(inf.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add influencer</DialogTitle>
            <DialogDescription>
              They'll get a unique referral code. Share ?ref=CODE links to track attribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sita Sharma" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Handle (optional)</Label>
                <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@sitacrafts" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sita@example.com" />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Commission type</Label>
                <Select value={commissionType} onValueChange={(v) => setCommissionType(v as 'percent' | 'fixed')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed per conversion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {commissionType === 'percent' ? 'Percentage (bps, 1000 = 10%)' : 'Amount (paisa, 10000 = रू100)'}
                </Label>
                <Input
                  type="number"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!name.trim() || createMut.isPending}
            >
              {createMut.isPending ? 'Adding…' : 'Add influencer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AffiliatesTab({ storeId }: { storeId: string }) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rate, setRate] = useState(500) // 5% default

  const { data, isLoading } = useQuery<{ affiliates: Affiliate[] }>({
    queryKey: ['affiliates', storeId],
    queryFn: async () => (await fetch(`/api/affiliates?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })
  const affiliates = data?.affiliates ?? []

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, name, email, commissionRateBps: rate }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliates'] })
      toast.success('Affiliate added')
      setCreating(false)
      setName(''); setEmail('')
    },
    onError: () => toast.error('Failed to create affiliate'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/affiliates/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliates'] })
      toast.success('Removed')
    },
  })

  const totalConversions = affiliates.reduce((s, a) => s + a.conversions, 0)
  const totalCommission = affiliates.reduce((s, a) => s + a.commissionEarned, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-3">
          <Users className="h-4 w-4 text-primary mb-1" />
          <p className="text-xl font-bold">{affiliates.length}</p>
          <p className="text-xs text-muted-foreground">Affiliates</p>
        </Card>
        <Card className="p-3">
          <MousePointerClick className="h-4 w-4 text-blue-600 mb-1" />
          <p className="text-xl font-bold">{totalConversions}</p>
          <p className="text-xs text-muted-foreground">Conversions</p>
        </Card>
        <Card className="p-3">
          <DollarSign className="h-4 w-4 text-amber-600 mb-1" />
          <p className="text-xl font-bold">{formatNPR(totalCommission)}</p>
          <p className="text-xs text-muted-foreground">Commission</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add affiliate
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : affiliates.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-sm text-muted-foreground">No affiliates yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {affiliates.map((aff) => (
            <Card key={aff.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{aff.name}</p>
                    {aff.email && <span className="text-xs text-muted-foreground">{aff.email}</span>}
                    <Badge variant={aff.status === 'active' ? 'default' : 'secondary'}>
                      {aff.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs bg-secondary px-2 py-0.5 rounded">?ref={aff.code}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`?ref=${aff.code}`)
                        toast.success('Code copied')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="inline h-3 w-3" /> copy
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {(aff.commissionRateBps / 100).toFixed(1)}% commission
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-semibold">{aff.clicks}</p>
                    <p className="text-[10px] text-muted-foreground">Clicks</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{aff.conversions}</p>
                    <p className="text-[10px] text-muted-foreground">Conv.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatNPR(aff.commissionEarned)}</p>
                    <p className="text-[10px] text-muted-foreground">Earned</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMut.mutate(aff.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add affiliate</DialogTitle>
            <DialogDescription>
              Affiliates earn a percentage commission on orders attributed to their referral link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="NepalTech Reviews" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" />
            </div>
            <div>
              <Label>Commission rate (bps, 500 = 5%)</Label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending}>
              {createMut.isPending ? 'Adding…' : 'Add affiliate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
