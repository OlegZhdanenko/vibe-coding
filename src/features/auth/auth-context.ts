import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { ProfileRow } from '@/types/database'

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: ProfileRow | null
  /** True until the initial session lookup settles — gates route redirects. */
  initialising: boolean
  /**
   * Resolves with `needsEmailConfirmation: true` when the project requires a
   * confirmation link, in which case no session exists yet.
   */
  signUp: (input: {
    email: string
    password: string
    fullName: string
  }) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Pick<ProfileRow, 'full_name' | 'plan'>>) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
