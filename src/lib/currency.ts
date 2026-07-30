// Multi-currency display helper.
// Backend stores everything in paisa (NPR smallest unit).
// This helper converts to display currency using static reference rates.
// In production, fetch live rates from Nepal Rastra Bank API or Open Exchange Rates.

import { formatNPR } from './nepal'

export type CurrencyCode = 'NPR' | 'USD' | 'INR'

// Static reference rates (1 NPR = X foreign currency)
// Updated periodically — in production fetch from NRB API (https://www.nrb.org.np/api/)
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  NPR: 1,
  USD: 0.0075,    // ~133 NPR = 1 USD
  INR: 0.625,     // ~1.6 NPR = 1 INR
}

export const CURRENCY_META: Record<CurrencyCode, {
  symbol: string
  locale: string
  label: string
  flag: string
}> = {
  NPR: { symbol: 'रू', locale: 'en-IN', label: 'Nepali Rupee', flag: '🇳🇵' },
  USD: { symbol: '$', locale: 'en-US', label: 'US Dollar', flag: '🇺🇸' },
  INR: { symbol: '₹', locale: 'en-IN', label: 'Indian Rupee', flag: '🇮🇳' },
}

export const DISPLAY_CURRENCIES: CurrencyCode[] = ['NPR', 'USD', 'INR']

// Convert paisa (NPR) → display currency
export function convertPaisa(paisa: number, to: CurrencyCode): number {
  const npr = paisa / 100
  return npr * EXCHANGE_RATES[to]
}

// Format paisa in the chosen display currency
export function formatPrice(paisa: number, currency: CurrencyCode = 'NPR'): string {
  if (currency === 'NPR') return formatNPR(paisa)
  const meta = CURRENCY_META[currency]
  const amount = convertPaisa(paisa, currency)
  const formatted = new Intl.NumberFormat(meta.locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
  return `${meta.symbol}${formatted}`
}

// Format with currency code (e.g. "USD 24.50")
export function formatPriceWithCode(paisa: number, currency: CurrencyCode = 'NPR'): string {
  const amount = convertPaisa(paisa, currency)
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
  return `${currency} ${formatted}`
}

// Dual display (e.g. "रू 1,500 · ~$11.25") — for showing NPR primary + secondary
export function formatDualPrice(paisa: number, secondary: CurrencyCode = 'USD'): string {
  return `${formatNPR(paisa)} · ~${formatPrice(paisa, secondary)}`
}

// Round to ~round numbers for nicer UX (NPR shows whole, USD shows .99)
export function roundDisplayPrice(paisa: number, currency: CurrencyCode): number {
  if (currency === 'NPR') return Math.round(paisa / 100) * 100
  if (currency === 'USD') return Math.round(paisa / 100) * 100 // nearest dollar
  if (currency === 'INR') return Math.round(paisa / 100) * 100
  return paisa
}
