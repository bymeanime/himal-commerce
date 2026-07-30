import { describe, it, expect } from 'vitest'
import {
  convertPaisa,
  formatPrice,
  formatPriceWithCode,
  formatDualPrice,
  EXCHANGE_RATES,
  CURRENCY_META,
} from '@/lib/currency'

describe('currency helpers', () => {
  it('converts paisa to NPR (no-op since 100 paisa = 1 NPR)', () => {
    // 5000 paisa = Rs 50
    expect(convertPaisa(5000, 'NPR')).toBe(50)
  })

  it('converts paisa to USD using static rate', () => {
    // 5000 paisa = Rs 50 = 50 * 0.0075 USD = 0.375
    expect(convertPaisa(5000, 'USD')).toBeCloseTo(0.375, 5)
  })

  it('converts paisa to INR using static rate', () => {
    // 5000 paisa = Rs 50 = 50 * 0.625 INR = 31.25
    expect(convertPaisa(5000, 'INR')).toBeCloseTo(31.25, 5)
  })

  it('formats NPR with the Nepali locale', () => {
    // 5000 paisa = Rs 50
    const out = formatPrice(5000, 'NPR')
    expect(out).toMatch(/रू|Rs/)
    expect(out).toContain('50')
  })

  it('formats USD with $ symbol', () => {
    const out = formatPrice(5000, 'USD')
    expect(out).toContain('$')
    expect(out).toContain('0.38')
  })

  it('formats INR with ₹ symbol', () => {
    const out = formatPrice(5000, 'INR')
    expect(out).toContain('₹')
    expect(out).toContain('31.25')
  })

  it('formatPriceWithCode includes currency code', () => {
    const out = formatPriceWithCode(5000, 'USD')
    expect(out).toContain('USD')
  })

  it('formatDualPrice shows both NPR and secondary', () => {
    const out = formatDualPrice(5000, 'USD')
    expect(out).toContain('·')
    expect(out).toContain('~')
  })

  it('handles zero correctly', () => {
    expect(convertPaisa(0, 'NPR')).toBe(0)
    expect(convertPaisa(0, 'USD')).toBe(0)
    expect(convertPaisa(0, 'INR')).toBe(0)
  })

  it('all currency codes have metadata', () => {
    for (const code of ['NPR', 'USD', 'INR'] as const) {
      expect(CURRENCY_META[code]).toBeDefined()
      expect(CURRENCY_META[code].symbol).toBeTruthy()
      expect(CURRENCY_META[code].locale).toBeTruthy()
      expect(CURRENCY_META[code].label).toBeTruthy()
    }
  })

  it('exchange rates are positive numbers', () => {
    for (const code of ['NPR', 'USD', 'INR'] as const) {
      expect(EXCHANGE_RATES[code]).toBeGreaterThan(0)
    }
    // NPR rate is always 1 (base currency)
    expect(EXCHANGE_RATES.NPR).toBe(1)
  })
})
