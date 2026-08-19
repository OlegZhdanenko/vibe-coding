import type { Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context'
import { mapAuthError } from '@/features/auth/auth-errors'
import { appError } from '@/lib/errors'
import { requireSupabase, supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types/database'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  // With no Supabase client there is no session to wait for, so the app is
  // ready immediately rather than after an effect flips the flag.
  const [initialising, setInitialising] = useState(() => Boolean(supabase))

  // Guards against setting state after unmount during the async bootstrap.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // A missing profile row is recoverable (the trigger may lag); a real
      // failure should not take the whole app down either.
      console.error('Failed to load profile:', error.message)
      return null
    }
    return data
  }, [])

  useEffect(() => {
    if (!supabase) return

    const client = supabase

    void client.auth.getSession().then(async ({ data }) => {
      if (!mounted.current) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        const row = await loadProfile(data.session.user.id)
        if (mounted.current) setProfile(row)
      }
      if (mounted.current) setInitialising(false)
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted.current) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }
      void loadProfile(nextSession.user.id).then((row) => {
        if (mounted.current) setProfile(row)
      })
    })

    return () => subscription.subscription.unsubscribe()
  }, [loadProfile])

  const signUp = useCallback<AuthContextValue['signUp']>(async ({ email, password, fullName }) => {
    try {
      const client = requireSupabase()
      const { error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
    } catch (error) {
      throw mapAuthError(error)
    }
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async ({ email, password }) => {
    try {
      const client = requireSupabase()
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      throw mapAuthError(error)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const client = requireSupabase()
      const { error } = await client.auth.signOut()
      if (error) throw error
      setProfile(null)
    } catch (error) {
      throw mapAuthError(error)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const row = await loadProfile(user.id)
    if (mounted.current) setProfile(row)
  }, [loadProfile, user])

  const updateProfile = useCallback<AuthContextValue['updateProfile']>(
    async (patch) => {
      if (!user) throw appError('unauthorized')

      const client = requireSupabase()
      const { data, error } = await client
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw appError('unknown', { userMessage: error.message, cause: error })
      }
      if (mounted.current) setProfile(data)
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      initialising,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }),
    [user, session, profile, initialising, signUp, signIn, signOut, updateProfile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
