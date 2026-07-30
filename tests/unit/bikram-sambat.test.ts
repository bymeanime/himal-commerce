import { describe, it, expect } from 'vitest'
import { adToBs, fiscalYearBs, formatDualDate, formatInvoiceNumber } from '@/lib/bikram-sambat'

describe('bikram-sambat conversion', () => {
  it('converts a known AD date to BS (mid-year, no edge case)', () => {
    // 1 August 2024 AD → ~17 Shrawan 2081 BS
    const bs = adToBs(new Date(2024, 7, 1)) // month is 0-indexed
    expect(bs.year).toBe(2081)
    expect(bs.month).toBeGreaterThanOrEqual(3)
    expect(bs.month).toBeLessThanOrEqual(5)
    expect(bs.monthName).toBeTruthy()
    expect(bs.formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(bs.formattedLong).toContain('BS')
  })

  it('handles BS new year transition (before April 14)', () => {
    // 1 Jan 2024 AD — still in BS year 2080 (new year starts ~Apr 14)
    const bs = adToBs(new Date(2024, 0, 1))
    expect(bs.year).toBe(2080)
  })

  it('handles BS new year transition (after April 14)', () => {
    // 1 May 2024 AD — in BS year 2081
    const bs = adToBs(new Date(2024, 4, 1))
    expect(bs.year).toBe(2081)
  })

  it('computes fiscal year (Shrawan-start, Shrawan = month 4)', () => {
    // August is in Shrawan (month 4) → fiscal year starts this BS year
    const bs = adToBs(new Date(2024, 7, 1)) // Aug 2024
    expect(bs.fiscalYear).toMatch(/^\d{4}-\d{2}$/)
    // Fiscal year should be 2081-82
    expect(bs.fiscalYear).toBe('2081-82')
  })

  it('fiscal year for pre-Shrawan months rolls back', () => {
    // February 2024 → BS month ~10/11 (Falgun) → fiscal year 2080-81
    const bs = adToBs(new Date(2024, 1, 1))
    expect(bs.fiscalYear).toBe('2080-81')
  })

  it('fiscalYearBs() defaults to now', () => {
    const fy = fiscalYearBs()
    expect(fy).toMatch(/^\d{4}-\d{2}$/)
  })

  it('formatDualDate shows both AD and BS', () => {
    const out = formatDualDate(new Date(2024, 7, 1))
    expect(out).toContain('Aug')
    expect(out).toContain('2024')
    expect(out).toContain('BS')
  })

  it('formatInvoiceNumber generates fiscal-year-scoped sequential number', () => {
    const out = formatInvoiceNumber('INV', 123, '2081-82')
    expect(out).toBe('INV-2081-82-000123')
  })

  it('formatInvoiceNumber zero-pads to 6 digits', () => {
    expect(formatInvoiceNumber('INV', 1, '2081-82')).toBe('INV-2081-82-000001')
    expect(formatInvoiceNumber('INV', 999999, '2081-82')).toBe('INV-2081-82-999999')
  })

  it('BS year is always AD year + 56 or + 57', () => {
    for (let m = 0; m < 12; m++) {
      const bs = adToBs(new Date(2024, m, 15))
      expect(bs.year - 2024).toBeGreaterThanOrEqual(56)
      expect(bs.year - 2024).toBeLessThanOrEqual(57)
    }
  })
})
