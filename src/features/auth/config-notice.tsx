import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { isSupabaseConfigured } from '@/lib/env'

/**
 * Shown instead of a broken form when the deployment has no Supabase keys.
 * Without it, submitting would fail with an opaque error on a live demo.
 */
export function ConfigNotice() {
  if (isSupabaseConfigured) return null

  return (
    <Alert className="mb-6">
      <Info className="size-4" aria-hidden="true" />
      <AlertTitle>Accounts are not configured</AlertTitle>
      <AlertDescription>
        This deployment is missing <code>VITE_SUPABASE_URL</code> and{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>, so sign-in is disabled. See the README for setup.
      </AlertDescription>
    </Alert>
  )
}
