'use client'

import { useQuery } from '@tanstack/react-query'
import { useUI } from '@/lib/ui-store'
import type { Store } from '@/lib/types'

// Returns the current store object (or null if at platform level)
export function useCurrentStore() {
  const storeId = useUI((s) => s.currentStoreId)
  const { data, isLoading } = useQuery<{ store: Store | null }>({
    queryKey: ['store', storeId],
    queryFn: async () => {
      if (!storeId) return { store: null }
      const res = await fetch(`/api/stores/${storeId}`)
      if (!res.ok) return { store: null }
      return res.json()
    },
    enabled: !!storeId,
  })
  return { store: data?.store ?? null, isLoading, storeId }
}
