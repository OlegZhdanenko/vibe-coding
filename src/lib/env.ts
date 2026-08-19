/**
 * Client-side environment access.
 *
 * Nothing here throws at import time: the landing page and the marketing routes
 * must render even when the deployment has no Supabase project wired up yet.
 * Features that genuinely need a value check the `is*Configured` flags and show
 * a proper message instead of crashing.
 */

const read = (value: string | undefined) => value?.trim() ?? ''

export const env = {
  supabaseUrl: read(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: read(import.meta.env.VITE_SUPABASE_ANON_KEY),
  /** Where the generation endpoint lives. Same-origin `/api` in production. */
  apiBaseUrl: read(import.meta.env.VITE_API_BASE_URL) || '/api',
  appName: read(import.meta.env.VITE_APP_NAME) || 'Inboxly',
} as const

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)
