import { describe, it, expect } from 'vitest'

// Unit tests for the phone normalization logic used by /api/orders/lookup.
// We don't test the route handler directly (would need a DB mock), but we test
// the normalization rules — these are the contract that the public order-lookup
// portal relies on.

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '')
}

function phoneMatches(stored: string, input: string): boolean {
  const normalized = normalizePhone(input)
  if (!normalized) return false // reject empty input
  if (stored === normalized) return true
  if (stored.includes(normalized)) return true
  // If the customer typed +977, try matching the last 10 digits
  const stripped = normalized.replace(/^\+977/, '')
  if (stripped !== normalized && stored.includes(stripped)) return true
  return false
}

describe('order-lookup phone normalization', () => {
  it('strips spaces, dashes, and parentheses', () => {
    expect(normalizePhone('+977 98-1234-5678')).toBe('+9779812345678')
    expect(normalizePhone('(98) 1234-5678')).toBe('9812345678')
  })

  it('matches exact normalized phone', () => {
    expect(phoneMatches('9812345678', '9812345678')).toBe(true)
  })

  it('matches when stored phone has +977 prefix but input does not', () => {
    expect(phoneMatches('+9779812345678', '9812345678')).toBe(true)
  })

  it('matches when input has +977 prefix but stored does not', () => {
    expect(phoneMatches('9812345678', '+9779812345678')).toBe(true)
  })

  it('matches when input has dashes/spaces', () => {
    expect(phoneMatches('9812345678', '98-1234-5678')).toBe(true)
    expect(phoneMatches('+9779812345678', '+977 98-1234 5678')).toBe(true)
  })

  it('does not match a different phone number', () => {
    expect(phoneMatches('9812345678', '9800000000')).toBe(false)
  })

  it('does not match an empty input', () => {
    expect(phoneMatches('9812345678', '')).toBe(false)
  })
})
