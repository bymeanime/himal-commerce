// Multi-currency display helper.
// Backend stores everything in paisa (NPR smallest unit).
// This helper converts to display currency using reference rates.
//
// In production, fetches live rates from Nepal Rastra Bank API (daily forex).
// Falls back to static rates if the API is unreachable.

import { formatNPR } from './nepal'

export type CurrencyCode = 'NPR' | 'USD' | 'INR'

// Static fallback reference rates (1 NPR = X foreign currency)
// Used when the live NRB API is unreachable or in dev/test.
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  NPR: 1,
  USD: 0.0075,    // ~133 NPR = 1 USD
  INR: 0.625,     // ~1.6 NPR = 1 INR
}

// Current rates — initialized to fallback, updated by fetchLiveRates()
let currentRates: Record<CurrencyCode, number> = { ...FALLBACK_RATES }
let lastFetchAt = 0
let fetchInProgress: Promise<void> | null = null

// Live rates are cached for 6 hours (NRB updates daily, but we refresh more
// often to catch mid-day corrections).
const RATE_CACHE_MS = 6 * 60 * 60 * 1000

export const EXCHANGE_RATES = currentRates

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

/**
 * Fetch live exchange rates from Nepal Rastra Bank.
 * NRB publishes daily forex rates at https://www.nrb.org.np/api/
 *
 * The API returns rates as 1 USD = X NPR, so we invert to get 1 NPR = 1/X USD.
 *
 * This function is safe to call from server-side code (API routes, SSR pages).
 * It caches results for RATE_CACHE_MS to avoid hammering the NRB API.
 */
export async function fetchLiveRates(): Promise<Record<CurrencyCode, number>> {
  const now = Date.now()
  if (now - lastFetchAt < RATE_CACHE_MS && lastFetchAt > 0) {
    return currentRates
  }
  if (fetchInProgress) {
    await fetchInProgress
    return currentRates
  }

  fetchInProgress = (async () => {
    try {
      // NRB daily forex API
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '-')
      const res = await fetch(
        `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=5&from=${today}&to=${today}`,
        { next: { revalidate: RATE_CACHE_MS / 1000 } }
      )
      if (!res.ok) throw new Error(`NRB API returned ${res.status}`)
      const data = await res.json()
      const rates = data?.data?.payload?.[0]?.rates
      if (!rates || !Array.isArray(rates)) throw new Error('Unexpected NRB API response shape')

      // Find USD and INR rates (1 unit foreign = X NPR)
      const usdRate = rates.find((r: { currency: { iso3: string } }) => r.currency?.iso3 === 'USD')
      const inrRate = rates.find((r: { currency: { iso3: string } }) => r.currency?.iso3 === 'INR')

      const newRates: Record<CurrencyCode, number> = { NPR: 1, USD: 0, INR: 0 }
      if (usdRate?.buy) {
        // buy is in NPR per 1 USD — but NRB quotes USD per unit, which is NPR per 1 USD
        // For USD the unit is 1, so buy = NPR per 1 USD
        // 1 NPR = 1 / buy USD
        const usdNpr = parseFloat(usdRate.buy)
        if (usdNpr > 0) newRates.USD = 1 / usdNpr
      }
      if (inrRate?.buy) {
        // For INR the unit is 100, so buy = NPR per 100 INR
        // 1 NPR = 100 / buy INR
        const inrNprPer100 = parseFloat(inrRate.buy)
        if (inrNprPer100 > 0) newRates.INR = 100 / inrNprPer100
      }

      // Only update if we got valid rates; otherwise keep fallback
      if (newRates.USD > 0 && newRates.INR > 0) {
        currentRates = newRates
        lastFetchAt = now
      } else {
        throw new Error('Could not parse USD/INR rates from NRB API')
      }
    } catch (e) {
      // Keep fallback rates — never crash the page over currency display
      console.warn('[currency] Live rate fetch failed, using fallback:', (e as Error).message)
      // Mark as fetched so we don't retry for the cache window
      lastFetchAt = now
    } finally {
      fetchInProgress = null
    }
  })()

  await fetchInProgress
  return currentRates
}

// Convert paisa (NPR) → display currency
export function convertPaisa(paisa: number, to: CurrencyCode): number {
  const npr = paisa / 100
  return npr * currentRates[to]
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
