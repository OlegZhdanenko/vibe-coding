import { env } from '@/lib/env'
import { appError, codeFromStatus, type AppErrorCode } from '@/lib/errors'
import type {
  GenerateEmailInput,
  GeneratedEmail,
  GenerationEvent,
} from '@/lib/generation/types'

export interface GenerationResult {
  email: GeneratedEmail
  model: string
  generationsUsed: number | null
}

interface StreamOptions {
  /** Supabase access token; the endpoint rejects unauthenticated calls. */
  accessToken?: string
  /** Called for every text chunk so the UI can render as it arrives. */
  onDelta?: (text: string, accumulated: string) => void
  signal?: AbortSignal
}

/**
 * Calls the generation endpoint and consumes its newline-delimited JSON stream.
 *
 * Frames can straddle chunk boundaries, so partial lines are buffered until a
 * newline arrives rather than parsed eagerly.
 */
export async function streamGeneration(
  input: GenerateEmailInput,
  { accessToken, onDelta, signal }: StreamOptions = {},
): Promise<GenerationResult> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(input),
      signal,
    })
  } catch (error) {
    if (isAbort(error)) throw error
    throw appError('network', { cause: error })
  }

  if (!response.ok) {
    throw await errorFromResponse(response)
  }

  if (!response.body) {
    throw appError('unknown', { userMessage: 'The server returned an empty response.' })
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let accumulated = ''
  let result: GenerationResult | null = null

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += value
      const lines = buffer.split('\n')
      // The trailing element is either empty or an incomplete frame.
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const event = parseFrame(line)
        if (!event) continue

        if (event.type === 'delta') {
          accumulated += event.text
          onDelta?.(event.text, accumulated)
        } else if (event.type === 'done') {
          result = {
            email: event.email,
            model: event.model,
            generationsUsed: event.generationsUsed,
          }
        } else {
          throw appError(event.code as AppErrorCode, { userMessage: event.message })
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (!result) {
    throw appError('provider_error', {
      userMessage: 'The draft was cut off before it finished. Please try again.',
    })
  }

  return result
}

function parseFrame(line: string): GenerationEvent | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed) as GenerationEvent
  } catch {
    // A malformed frame is not worth failing the whole generation over.
    console.warn('[generation] Skipped an unreadable frame:', trimmed)
    return null
  }
}

async function errorFromResponse(response: Response) {
  try {
    const body = (await response.json()) as Partial<GenerationEvent & { message: string }>
    if (body?.message) {
      return appError(codeFromStatus(response.status), {
        userMessage: body.message,
        status: response.status,
      })
    }
  } catch {
    // Fall through to a status-derived message.
  }
  return appError(codeFromStatus(response.status), { status: response.status })
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
