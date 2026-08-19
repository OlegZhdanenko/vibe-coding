import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { toUserMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { EmailRow } from '@/types/database'

const PAGE_SIZE = 20

async function fetchDrafts(userId: string): Promise<EmailRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw error
  return data ?? []
}

/** Loads the signed-in user's saved drafts, newest first. */
export function useEmailHistory() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState<EmailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // `cancelled` keeps a slow response for a previous user from overwriting a
    // newer one, and avoids setting state after unmount.
    let cancelled = false

    void (async () => {
      if (!userId) {
        if (!cancelled) {
          setItems([])
          setLoading(false)
        }
        return
      }

      try {
        const rows = await fetchDrafts(userId)
        if (cancelled) return
        setItems(rows)
        setError(null)
      } catch (caught) {
        if (!cancelled) setError(toUserMessage(caught))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchDrafts(userId))
    } catch (caught) {
      setError(toUserMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [userId])

  const remove = useCallback(async (id: string) => {
    if (!supabase) return

    // Optimistic removal, restored from the snapshot if the delete is rejected.
    let snapshot: EmailRow[] = []
    setItems((current) => {
      snapshot = current
      return current.filter((item) => item.id !== id)
    })

    const { error: deleteError } = await supabase.from('emails').delete().eq('id', id)
    if (deleteError) {
      setItems(snapshot)
      throw deleteError
    }
  }, [])

  return { items, loading, error, reload, remove }
}
