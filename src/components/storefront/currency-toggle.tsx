'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/lib/currency-store'
import { DISPLAY_CURRENCIES, CURRENCY_META } from '@/lib/currency'
import { Check, Coins } from 'lucide-react'

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  const meta = CURRENCY_META[currency]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9">
          <Coins className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{meta.flag} {currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">
          Display currency
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DISPLAY_CURRENCIES.map((code) => {
          const m = CURRENCY_META[code]
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setCurrency(code)}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{m.flag}</span>
                <span className="text-sm">{code}</span>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </span>
              {code === currency && <Check className="h-3 w-3 text-emerald-600" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
          Prices are settled in NPR. Other currencies are indicative.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
