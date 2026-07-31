// Admin API client — wraps fetch() with the x-admin-token header.
//
// All admin components should use this instead of raw fetch() for any
// /api/* call that is now gated behind requireAdmin().
//
// The token is stored in localStorage under 'himal_admin_token' and is
// expected to match the server's ADMIN_TOKEN env var.
//
// Until real next-auth is wired, this is the stopgap auth: ops sets
// ADMIN_TOKEN on Vercel, an admin visits /admin-login (or sets the
// localStorage key manually after entering the token in a prompt), and
// all subsequent admin API calls carry the header automatically.

const TOKEN_KEY = 'himal_admin_token'

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function hasAdminToken(): boolean {
  return !!getAdminToken()
}

interface AdminFetchOptions extends RequestInit {
  // If true, send the x-admin-token header (default: true for admin calls)
  withAdminToken?: boolean
}

export async function adminFetch(input: string, opts: AdminFetchOptions = {}): Promise<Response> {
  const { withAdminToken = true, headers: customHeaders, ...rest } = opts
  const headers = new Headers(customHeaders)
  if (withAdminToken) {
    const token = getAdminToken()
    if (token) {
      headers.set('x-admin-token', token)
    }
  }
  return fetch(input, { ...rest, headers })
}

export async function adminJson<T = unknown>(input: string, opts?: AdminFetchOptions): Promise<T> {
  const res = await adminFetch(input, opts)
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((errBody as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
