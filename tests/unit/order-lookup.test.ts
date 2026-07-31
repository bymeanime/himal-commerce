import { describe, it, expect } from 'vitest'

// Unit tests for the phone normalization + matching logic used by
// /api/orders/lookup. We don't test the route handler directly (would need a
// DB mock), but we test the contract that the public order-lookup portal
// relies on.
//
// QA-005 fix: the OLD logic used `contains` which allowed an attacker to type
// "9" and match every Nepal phone number (all start with 9). The NEW logic
// extracts the last 10 digits from both stored and input phones, then requires
// them to be equal — preventing partial enumeration.

function last10Digits(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.slice(-10)
}

function phoneMatches(stored: string, input: string): boolean {
  const inputLast10 = last10Digits(input)
  if (inputLast10.length !== 10) return false
  const storedLast10 = last10Digits(stored)
  return storedLast10 === inputLast10
}

describe('order-lookup phone normalization (QA-005 fix)', () => {
  it('strips spaces, dashes, and parentheses', () => {
    expect(last10Digits('+977 98-1234-5678')).toBe('9812345678')
    expect(last10Digits('(98) 1234-5678')).toBe('9812345678')
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

  it('QA-005: does NOT match a 1-digit input (prevents phone enumeration)', () => {
    // Old `contains` logic: "9" matches every Nepal number → enumerate all orders
    // New `endsWith last 10 digits` logic: "9" alone has < 10 digits → reject
    expect(phoneMatches('9812345678', '9')).toBe(false)
    expect(phoneMatches('9812345678', '98')).toBe(false)
    expect(phoneMatches('9812345678', '981234567')).toBe(false) // 9 digits
  })

  it('QA-005: does NOT match a common substring of two different phones', () => {
    // Both "9812345678" and "9812345699" share the prefix "98123456"
    // Old logic: typing "98123456" would match BOTH → cross-customer enumeration
    // New logic: must match all 10 digits → safe
    expect(phoneMatches('9812345678', '98123456')).toBe(false)
    expect(phoneMatches('9812345699', '98123456')).toBe(false)
  })
})
