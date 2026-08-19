import { appError } from '../../src/lib/errors.js'
import { SYSTEM_PROMPT, buildUserPrompt, maxTokensFor } from '../../src/lib/generation/prompt.js'
import type { GenerateEmailInput } from '../../src/lib/generation/types.js'
import type { EmailProvider } from './types.js'

const MODEL = 'gemini-3.6-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`

/**
 * Google Gemini provider.
 *
 * Called over plain `fetch` rather than through the Google SDK: the request is
 * a single POST, the response is ordinary SSE, and the handler already runs on
 * a Web-standard runtime. Adding a dependency would buy nothing and would have
 * to be audited for edge compatibility.
 *
 * `thinkingLevel: 'low'` is the counterpart of the Anthropic provider's
 * `effort: 'low'` — writing one short email is routine work, and the default
 * spends tokens and latency on reasoning this task does not need.
 */
export function createGeminiProvider(apiKey: string): EmailProvider {
  return {
    id: 'gemini',
    model: MODEL,

    async *stream(input: GenerateEmailInput, signal?: AbortSignal) {
      let response: Response
      try {
        response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
            generationConfig: {
              maxOutputTokens: maxTokensFor(input.length),
              temperature: 0.7,
              thinkingConfig: { thinkingLevel: 'low' },
            },
          }),
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error
        throw appError('network', { cause: error })
      }

      if (!response.ok || !response.body) {
        throw await errorFromResponse(response)
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      let produced = false

      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += value
          const lines = buffer.split('\n')
          // Keep the trailing fragment: an SSE event can straddle two chunks.
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const chunk = parseEvent(line)
            if (chunk === null) continue
            if (chunk.blocked) throw blockedError(chunk.blocked)
            if (chunk.text) {
              produced = true
              yield chunk.text
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (!produced) {
        throw appError('provider_error', {
          userMessage: 'The model returned an empty draft. Please try again.',
        })
      }
    },
  }
}

interface ParsedEvent {
  text: string
  blocked?: string
}

/** Extract text from one `data:` line, or `null` if the line carries none. */
function parseEvent(line: string): ParsedEvent | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null

  const payload = trimmed.slice(5).trim()
  if (!payload || payload === '[DONE]') return null

  let event: unknown
  try {
    event = JSON.parse(payload)
  } catch {
    // One unreadable frame is not worth failing the whole generation over.
    console.warn('[gemini] Skipped an unreadable SSE frame')
    return null
  }

  const data = event as {
    promptFeedback?: { blockReason?: string }
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  }

  if (data.promptFeedback?.blockReason) {
    return { text: '', blocked: data.promptFeedback.blockReason }
  }

  const candidate = data.candidates?.[0]
  if (candidate?.finishReason && ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(candidate.finishReason)) {
    return { text: '', blocked: candidate.finishReason }
  }

  const text = (candidate?.content?.parts ?? []).map((part) => part.text ?? '').join('')
  return { text }
}

function blockedError(reason: string) {
  return appError('provider_error', {
    userMessage:
      'The model declined to write this email. Try rephrasing the topic in a different way.',
    message: `gemini blocked: ${reason}`,
  })
}

async function errorFromResponse(response: Response) {
  let detail = ''
  try {
    const body = (await response.json()) as { error?: { message?: string } }
    detail = body.error?.message ?? ''
  } catch {
    // Fall through to a status-derived message.
  }

  if (response.status === 401 || response.status === 403) {
    return appError('not_configured', {
      userMessage: 'The AI provider rejected our credentials. Please contact the site owner.',
      message: detail,
      status: 503,
    })
  }
  if (response.status === 429) {
    return appError('rate_limited', {
      userMessage: 'The free AI quota for this deployment is exhausted. Please try again later.',
      message: detail,
      status: 429,
    })
  }
  if (response.status === 400) {
    return appError('invalid_input', {
      userMessage: 'The AI provider rejected this request. Try shortening the topic.',
      message: detail,
      status: 400,
    })
  }

  return appError('provider_error', { message: detail, status: response.status })
}
