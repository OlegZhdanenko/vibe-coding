import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from '@/lib/env'
import { appError } from '@/lib/errors'
import type { Database } from '@/types/database'

/**
 * `null` when the deployment has no Supabase credentials. Callers must go
 * through `requireSupabase()` so a missing configuration surfaces as a readable
 * message instead of a `Cannot read properties of null` crash.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw appError('not_configured', {
      userMessage:
        'Authentication is not configured on this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts.',
    })
  }
  return supabase
}
