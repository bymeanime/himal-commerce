'use client'

import { Mountain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, showText = true, size = 'md' }: { className?: string; showText?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7'
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-sm', iconSize)}>
        <Mountain className="h-3/5 w-3/5" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold tracking-tight text-foreground', textSize)}>
            Himal Commerce
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Made in Nepal · हिमाल
            </span>
          )}
        </div>
      )}
    </div>
  )
}
