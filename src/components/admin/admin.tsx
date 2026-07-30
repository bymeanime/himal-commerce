'use client'

import { AdminShell } from './admin-shell'
import { AdminDashboard } from './dashboard'
import { AdminProducts } from './products'
import { AdminOrders } from './orders'
import { AdminCustomers } from './customers'
import { AdminCategories } from './categories'
import { AdminSettings } from './settings'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { Button } from '@/components/ui/button'
import { Mountain, ArrowLeft } from 'lucide-react'

export function Admin() {
  const section = useUI((s) => s.adminSection)
  const { storeId } = useCurrentStore()
  const exitToPlatform = useUI((s) => s.exitToPlatform)

  if (!storeId) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="text-center space-y-3">
          <Mountain className="h-10 w-10 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">No store selected for admin.</p>
          <Button onClick={exitToPlatform}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to all stores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AdminShell>
      {section === 'dashboard' && <AdminDashboard />}
      {section === 'products' && <AdminProducts />}
      {section === 'orders' && <AdminOrders />}
      {section === 'customers' && <AdminCustomers />}
      {section === 'categories' && <AdminCategories />}
      {section === 'settings' && <AdminSettings />}
    </AdminShell>
  )
}
