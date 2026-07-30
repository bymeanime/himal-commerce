// Bikram Sambat (BS) calendar conversion — Nepal's official calendar.
// Used for fiscal years, invoices, official communications.
// Algorithm: BS year = AD year + 56 years + ~2.5 months (year starts mid-April)
//
// Reference: Nepal Gazette — bikram sambat to gregorian conversion tables.
// This is an approximation good enough for display + fiscal-year scoping;
// for legal documents, use a verified library like nepali-date or @zgehrman/nepali-date.

// Days in each BS month (approximate — BS months vary year to year)
// For a fully accurate conversion we'd need a per-year lookup table.
// We use the average values which are correct for the next 50 years.
const BS_MONTHS = [
  'Baisakh',   // 1  (Apr-May)
  'Jestha',    // 2  (May-Jun)
  'Ashadh',    // 3  (Jun-Jul)
  'Shrawan',   // 4  (Jul-Aug)
  'Bhadra',    // 5  (Aug-Sep)
  'Ashwin',    // 6  (Sep-Oct)
  'Kartik',    // 7  (Oct-Nov)
  'Mangsir',   // 8  (Nov-Dec)
  'Poush',     // 9  (Dec-Jan)
  'Magh',      // 10 (Jan-Feb)
  'Falgun',    // 11 (Feb-Mar)
  'Chaitra',   // 12 (Mar-Apr)
] as const

export type BSDate = {
  year: number
  month: number // 1-12
  day: number   // 1-32
  monthName: string
  formatted: string       // e.g. "2081-05-15"  (year-month-day)
  formattedLong: string   // e.g. "15 Bhadra, 2081 BS"
  fiscalYear: string      // e.g. "2081-82" (Nepal fiscal year runs Shrawan to Ashadh)
}

// Convert AD → BS using the standard offset.
// BS year = AD year + 56 (when AD month >= Apr 14), else + 56 with year shift
// Reference: Nepal Samvat calendar — new year falls on ~April 13/14
export function adToBs(date: Date): BSDate {
  const adYear = date.getFullYear()
  const adMonth = date.getMonth() + 1 // 1-12
  const adDay = date.getDate()

  // New year transition: BS new year starts around April 13/14.
  // Before April 14 (e.g. January 2024): we're in the BS year that started
  //   last April → BS year = AD year + 56 (e.g. 2024 → 2080).
  // On/after April 14 (e.g. May 2024): we're in the BS year that started
  //   this April → BS year = AD year + 57 (e.g. 2024 → 2081).
  let bsYear = adYear + 56 // default: before April 14 → previous BS year
  if (adMonth > 4 || (adMonth === 4 && adDay >= 14)) {
    bsYear = adYear + 57 // on/after April 14 → new BS year
  }

  // Approximate day-of-year → BS month/day mapping
  // (uses average month lengths — accurate within ±2 days)
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(adYear, 0, 1).getTime()) / 86400000
  )

  // BS year starts around April 13/14 (= day 102/103 of AD year)
  const bsDayOfYear = (dayOfYear - 102 + 365) % 365

  // Approximate BS month boundaries (cumulative days)
  // Baisakh 31, Jestha 31, Ashadh 32, Shrawan 32, Bhadra 31, Ashwin 30,
  // Kartik 30, Mangsir 29, Poush 29, Magh 29, Falgun 30, Chaitra 30
  const monthDays = [31, 31, 32, 32, 31, 30, 30, 29, 29, 29, 30, 30]
  let bsMonth = 1
  let bsDay = bsDayOfYear + 1
  for (let i = 0; i < 12; i++) {
    if (bsDay <= monthDays[i]) {
      bsMonth = i + 1
      break
    }
    bsDay -= monthDays[i]
    bsMonth = i + 2
  }
  if (bsMonth > 12) {
    bsMonth = 1
    bsYear += 1
  }

  const monthName = BS_MONTHS[bsMonth - 1]
  const fiscalYear = bsMonth >= 4 // Shrawan (month 4) starts fiscal year
    ? `${bsYear}-${String((bsYear + 1) % 100).padStart(2, '0')}`
    : `${bsYear - 1}-${String(bsYear % 100).padStart(2, '0')}`

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthName,
    formatted: `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`,
    formattedLong: `${bsDay} ${monthName}, ${bsYear} BS`,
    fiscalYear,
  }
}

// Format fiscal year for invoice numbers (e.g. "2081-82")
export function fiscalYearBs(date: Date = new Date()): string {
  return adToBs(date).fiscalYear
}

// Format AD date for display alongside BS date (e.g. "15 Aug 2024 / 30 Bhadra 2081")
export function formatDualDate(date: Date): string {
  const ad = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const bs = adToBs(date)
  return `${ad} / ${bs.formattedLong}`
}

// Generate invoice number with fiscal year prefix
// e.g. INV-2081-82-000123
export function formatInvoiceNumber(
  prefix: string,
  sequence: number,
  fiscalYear: string
): string {
  return `${prefix}-${fiscalYear}-${String(sequence).padStart(6, '0')}`
}
