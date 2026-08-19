import Anthropic from '@anthropic-ai/sdk'
import { appError } from '../../src/lib/errors.js'
import { SYSTEM_PROMPT, buildUserPrompt, maxTokensFor } from '../../src/lib/generation/prompt.js'
import type { GenerateEmailInput } from '../../src/lib/generation/types.js'
import type { EmailProvider } from './types.js'

const MODEL = 'claude-opus-5'

/**
 * Claude-backed provider.
 *
 * Notes on the request shape:
 * - Streaming, so the dashboard can render the draft as it is written.
 * - `effort: 'low'` — writing one short email is routine work; low effort keeps
 *   it fast and cheap. Thinking stays on (the default on this model), which
 *   avoids the failure modes that come with disabling it outright.
 * - Server-side fallbacks are enabled so a policy decline on a borderline topic
 *   is retried on another model inside the same call instead of dead-ending.
 */
export function createAnthropicProvider(apiKey: string): EmailProvider {
  const client = new Anthropic({ apiKey })

  return {
    id: 'anthropic',
    model: MODEL,

    async *stream(input: GenerateEmailInput, signal?: AbortSignal) {
      try {
        const stream = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: maxTokensFor(input.length),
            system: SYSTEM_PROMPT,
            output_config: { effort: 'low' },
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            messages: [{ role: 'user', content: buildUserPrompt(input) }],
          },
          { signal },
        )

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta' &&
            event.delta.text
          ) {
            yield event.delta.text
          }
        }

        const message = await stream.finalMessage()

        // A refusal that survived the fallback chain returns HTTP 200 with no
        // usable text, so it has to be checked explicitly.
        if (message.stop_reason === 'refusal') {
          throw appError('provider_error', {
            userMessage:
              'The model declined to write this email. Try rephrasing the topic in a different way.',
            message: `refusal: ${message.stop_details?.category ?? 'unspecified'}`,
          })
        }
      } catch (error) {
        throw mapAnthropicError(error)
      }
    },
  }
}

function mapAnthropicError(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) {
    return appError('not_configured', {
      userMessage: 'The AI provider rejected our credentials. Please contact the site owner.',
      status: 401,
      cause: error,
    })
  }
  if (error instanceof Anthropic.RateLimitError) {
    return appError('rate_limited', {
      userMessage: 'The AI provider is rate limiting us. Please try again in a moment.',
      status: 429,
      cause: error,
    })
  }
  if (error instanceof Anthropic.BadRequestError) {
    // Anthropic returns 400 for an exhausted credit balance as well as for a
    // malformed request. Telling the user to shorten their topic when the
    // account simply needs topping up sends them chasing the wrong problem.
    if (/credit balance|billing|purchase credits/i.test(error.message)) {
      return appError('not_configured', {
        userMessage:
          'The AI provider is out of credit on this deployment. Please contact the site owner.',
        message: error.message,
        status: 503,
        cause: error,
      })
    }

    return appError('invalid_input', {
      userMessage: 'The AI provider rejected this request. Try shortening the topic.',
      status: 400,
      cause: error,
    })
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return appError('network', { cause: error })
  }
  if (error instanceof Anthropic.APIError) {
    return appError('provider_error', { status: error.status, cause: error })
  }
  return error
}
