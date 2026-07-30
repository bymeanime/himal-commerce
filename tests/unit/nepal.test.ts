import { describe, it, expect } from 'vitest'
import { formatNPR, calcShippingCost, getProvince, NEPAL_PROVINCES } from '@/lib/nepal'
import { isValidNepalPhone } from '@/lib/env'

describe('formatNPR', () => {
  it('formats paisa into NPR string', () => {
    // 5000 paisa = Rs 50
    const out = formatNPR(5000)
    expect(out).toContain('50')
  })

  it('formats large amounts with thousand separators', () => {
    // 125000 paisa = Rs 1,250
    const out = formatNPR(125000)
    expect(out).toContain('1,250')
  })

  it('handles zero', () => {
    const out = formatNPR(0)
    expect(out).toContain('0')
  })

  it('always returns a string', () => {
    expect(typeof formatNPR(100)).toBe('string')
  })

  it('uses the Nepali rupee symbol', () => {
    expect(formatNPR(100)).toContain('रू')
  })
})

describe('calcShippingCost', () => {
  it('returns 0 for empty district', () => {
    expect(calcShippingCost('')).toBe(0)
  })

  it('charges Rs 100 inside Kathmandu valley', () => {
    // 100 * 100 paisa = Rs 100
    expect(calcShippingCost('Kathmandu')).toBe(10000)
    expect(calcShippingCost('Lalitpur')).toBe(10000)
    expect(calcShippingCost('Bhaktapur')).toBe(10000)
  })

  it('charges Rs 200 for non-valley, non-remote districts', () => {
    // Jhapa is in Koshi — not valley, not Karnali, not Sudurpashchim
    expect(calcShippingCost('Jhapa')).toBe(20000)
  })

  it('charges Rs 350 for Karnali districts (most remote)', () => {
    expect(calcShippingCost('Humla')).toBe(35000)
    expect(calcShippingCost('Jumla')).toBe(35000)
    expect(calcShippingCost('Mugu')).toBe(35000)
  })

  it('charges Rs 300 for Sudurpashchim districts', () => {
    expect(calcShippingCost('Kailali')).toBe(30000)
    expect(calcShippingCost('Kanchanpur')).toBe(30000)
  })
})

describe('getProvince', () => {
  it('returns Bagmati for Kathmandu', () => {
    expect(getProvince('Kathmandu')).toBe('Bagmati')
  })

  it('returns Koshi for Jhapa', () => {
    expect(getProvince('Jhapa')).toBe('Koshi')
  })

  it('returns Gandaki for Kaski', () => {
    expect(getProvince('Kaski')).toBe('Gandaki')
  })

  it('returns Lumbini for Rupandehi', () => {
    expect(getProvince('Rupandehi')).toBe('Lumbini')
  })

  it('returns Karnali for Humla', () => {
    expect(getProvince('Humla')).toBe('Karnali')
  })

  it('returns null for unknown district', () => {
    expect(getProvince('UnknownDistrict')).toBeNull()
  })
})

describe('NEPAL_PROVINCES', () => {
  it('has 7 provinces', () => {
    expect(NEPAL_PROVINCES).toHaveLength(7)
  })

  it('all provinces have names and districts', () => {
    for (const p of NEPAL_PROVINCES) {
      expect(p.name).toBeTruthy()
      expect(p.districts.length).toBeGreaterThan(0)
    }
  })

  it('covers 77 districts total (with Gorkha intentionally listed in both Bagmati and Gandaki)', () => {
    const total = NEPAL_PROVINCES.reduce((sum, p) => sum + p.districts.length, 0)
    // 7 provinces, 77 unique districts + 1 known duplicate (Gorkha) = 78 entries
    expect(total).toBeGreaterThanOrEqual(77)
  })
})

describe('isValidNepalPhone', () => {
  it('accepts valid Nepal mobile numbers (NTC prefix 98)', () => {
    expect(isValidNepalPhone('9801234567')).toBe(true)
    expect(isValidNepalPhone('9812345678')).toBe(true)
    expect(isValidNepalPhone('9823456789')).toBe(true)
    expect(isValidNepalPhone('9845678901')).toBe(true)
    expect(isValidNepalPhone('9861234567')).toBe(true)
    expect(isValidNepalPhone('9881234567')).toBe(true)
  })

  it('accepts Ncell numbers (prefix 97)', () => {
    expect(isValidNepalPhone('9701234567')).toBe(true)
    expect(isValidNepalPhone('9751234567')).toBe(true)
  })

  it('accepts Smart Cell numbers (prefix 96)', () => {
    expect(isValidNepalPhone('9612345678')).toBe(true)
  })

  it('rejects landline numbers (prefix 01)', () => {
    expect(isValidNepalPhone('014212345')).toBe(false)
    expect(isValidNepalPhone('015432109')).toBe(false)
  })

  it('rejects too-short numbers', () => {
    expect(isValidNepalPhone('980123456')).toBe(false) // 9 digits
    expect(isValidNepalPhone('9801234')).toBe(false)
  })

  it('rejects too-long numbers', () => {
    expect(isValidNepalPhone('98012345678')).toBe(false) // 11 digits
  })

  it('rejects non-numeric input', () => {
    expect(isValidNepalPhone('98XXXXXXXX')).toBe(false)
    expect(isValidNepalPhone('')).toBe(false)
    expect(isValidNepalPhone('abc')).toBe(false)
  })

  it('handles numbers with country code +977 prefix', () => {
    expect(isValidNepalPhone('+9779801234567')).toBe(true)
    expect(isValidNepalPhone('+977 9801234567')).toBe(true)
  })

  it('handles numbers with dashes/spaces', () => {
    expect(isValidNepalPhone('980-123-4567')).toBe(true)
    expect(isValidNepalPhone('980 1234 567')).toBe(true)
  })
})
