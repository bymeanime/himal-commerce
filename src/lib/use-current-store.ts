'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUI } from '@/lib/ui-store'
import type { Store } from '@/lib/types'

// Returns the current store object (or null if at platform level)
export function useCurrentStore() {
  const storeId = useUI((s) => s.currentStoreId)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ store: Store | null }>({
    queryKey: ['store', storeId],
    queryFn: async () => {
      if (!storeId) return { store: null }
      // QA-007/008 fix: GET /api/stores/[id] requires ?storeId= matching the route id.
      const res = await fetch(`/api/stores/${storeId}?storeId=${encodeURIComponent(storeId)}`)
      if (!res.ok) return { store: null }
      return res.json()
    },
    enabled: !!storeId,
  })
  return {
    store: data?.store ?? null,
    isLoading,
    storeId,
    refetch: () => qc.invalidateQueries({ queryKey: ['store', storeId] }),
  }
}
