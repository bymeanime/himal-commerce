'use client'

import { AdminShell } from './admin-shell'
import { AdminDashboard } from './dashboard'
import { AdminProducts } from './products'
import { AdminOrders } from './orders'
import { AdminCustomers } from './customers'
import { AdminSettings } from './settings'
import { useUI } from '@/lib/ui-store'

export function Admin() {
  const section = useUI((s) => s.adminSection)

  return (
    <AdminShell>
      {section === 'dashboard' && <AdminDashboard />}
      {section === 'products' && <AdminProducts />}
      {section === 'orders' && <AdminOrders />}
      {section === 'customers' && <AdminCustomers />}
      {section === 'settings' && <AdminSettings />}
    </AdminShell>
  )
}
