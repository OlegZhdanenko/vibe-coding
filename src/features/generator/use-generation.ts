import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { toAppError, type AppErrorCode } from '@/lib/errors'
import { streamGeneration, type GenerationResult } from '@/lib/generation/client'
import type { GenerateEmailInput } from '@/lib/generation/types'

export type GenerationStatus = 'idle' | 'streaming' | 'done' | 'error'

interface GenerationState {
  status: GenerationStatus
  /** Raw text as it streams in, before the subject line is split off. */
  streamedText: string
  result: GenerationResult | null
  error: string | null
  /** Lets callers react to specific failures, e.g. blocking a spent quota. */
  errorCode: AppErrorCode | null
}

const INITIAL: GenerationState = {
  status: 'idle',
  streamedText: '',
  result: null,
  error: null,
  errorCode: null,
}

/**
 * Owns one generation at a time: starting a new one cancels the previous
 * request, and unmounting aborts in flight work rather than leaking it.
 */
export function useGeneration() {
  const { session, refreshProfile } = useAuth()
  const [state, setState] = useState<GenerationState>(INITIAL)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState((current) =>
      current.status === 'streaming' ? { ...current, status: 'idle' } : current,
    )
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(INITIAL)
  }, [])

  const accessToken = session?.access_token

  const generate = useCallback(
    async (input: GenerateEmailInput) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({
        status: 'streaming',
        streamedText: '',
        result: null,
        error: null,
        errorCode: null,
      })

      try {
        const result = await streamGeneration(input, {
          accessToken,
          signal: controller.signal,
          onDelta: (_chunk, accumulated) => {
            setState((current) =>
              current.status === 'streaming' ? { ...current, streamedText: accumulated } : current,
            )
          },
        })

        setState({ status: 'done', streamedText: '', result, error: null, errorCode: null })
        // The quota counter moved server-side; pull the new value.
        void refreshProfile()
        return result
      } catch (error) {
        if (controller.signal.aborted) return null
        const appErr = toAppError(error)
        setState({
          status: 'error',
          streamedText: '',
          result: null,
          error: appErr.userMessage,
          errorCode: appErr.code,
        })
        return null
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [accessToken, refreshProfile],
  )

  return { ...state, generate, cancel, reset }
}
