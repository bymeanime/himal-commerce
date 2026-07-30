import { z } from 'zod'

// Env validation (Platform panel P2) — fail fast at boot if required env
// vars are missing, rather than getting a cryptic Prisma error 30 seconds
// into the first request.

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_PROVIDER: z.enum(['sqlite', 'postgresql']).default('sqlite'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Optional — analytics / monitoring
  SENTRY_DSN: z.string().optional(),
  SPARROW_SMS_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
})

function parseEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_PROVIDER: process.env.DATABASE_PROVIDER,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SPARROW_SMS_TOKEN: process.env.SPARROW_SMS_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
  })
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('[env] Invalid environment variables:', parsed.error.flatten().fieldErrors)
    // Don't throw in dev — let the request fail with a clearer Prisma error instead
    // of crashing the whole Next.js dev server.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`)
    }
  }
  return parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>)
}

export const env = parseEnv()

// URL validation (Cybersecurity panel P1) — reject `javascript:` and other
// dangerous protocols in user-supplied URLs (social media links, image URLs).
const SAFE_URL_SCHEMA = z
  .string()
  .url()
  .refine(u => /^https?:\/\//.test(u), 'Must be http(s) URL')
  .or(z.literal(''))
  .or(z.null())

export function safeUrl(input: string | null | undefined): string {
  if (!input) return ''
  const parsed = SAFE_URL_SCHEMA.safeParse(input)
  return parsed.success ? (parsed.data || '') : ''
}

// Phone validation (Logistics panel P2) — Nepal mobile format
export function isValidNepalPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '').replace(/^\+977/, '')
  return /^9[678]\d{8}$/.test(cleaned)
}
