'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ExportCSVButton — triggers a CSV download from a /api/export/* endpoint.
// Shows a spinner while downloading, then a toast on success/failure.
export function ExportCSVButton({
  endpoint,
  storeId,
  label,
  filename,
}: {
  endpoint: 'orders' | 'products' | 'customers'
  storeId: string
  label?: string
  filename?: string
}) {
  const [downloading, setDownloading] = useState(false)

  const handleExport = async () => {
    if (!storeId) {
      toast.error('No store selected')
      return
    }
    setDownloading(true)
    try {
      const url = `/api/export/${endpoint}?storeId=${encodeURIComponent(storeId)}`
      const res = await fetch(url)
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(e.error)
      }
      const blob = await res.blob()
      // Derive filename from content-disposition if present, else fallback
      const cd = res.headers.get('content-disposition') || ''
      const m = cd.match(/filename="?([^"]+)"?/)
      const name = filename || m?.[1] || `${endpoint}-${storeId}-${new Date().toISOString().slice(0, 10)}.csv`
      // Trigger download
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objUrl)
      toast.success(`Exported ${endpoint} CSV`)
    } catch (e) {
      toast.error('Export failed', { description: (e as Error).message })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={downloading}>
      <Download className="h-3.5 w-3.5 mr-1.5" />
      {downloading ? 'Exporting…' : (label || 'Export CSV')}
    </Button>
  )
}
