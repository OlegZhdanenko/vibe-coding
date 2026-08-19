import { createAnthropicProvider } from './anthropic.js'
import { createGeminiProvider } from './gemini.js'
import { createMockProvider } from './mock.js'
import type { EmailProvider } from './types.js'

export type { EmailProvider } from './types.js'

export type ProviderId = 'anthropic' | 'gemini' | 'mock'

/**
 * Picks the provider for this deployment.
 *
 * `EMAIL_PROVIDER` forces a choice; otherwise the first available credential
 * wins, and the offline writer is the floor so the app is never simply broken.
 *
 * Gemini is tried before Claude deliberately. It is the backend this deployment
 * actually runs on — its free tier needs no billing — so a stray
 * `ANTHROPIC_API_KEY` on an account without credit cannot silently take over
 * and break generation. Set `EMAIL_PROVIDER=anthropic` to prefer Claude.
 *
 * Adding a provider is one more case below plus the file implementing the
 * interface; nothing above this function changes.
 */
export function resolveProvider(env: Record<string, string | undefined>): EmailProvider {
  const requested = env.EMAIL_PROVIDER?.trim().toLowerCase()
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim()
  const geminiKey = env.GEMINI_API_KEY?.trim()

  switch (requested) {
    case 'mock':
      return createMockProvider()

    case 'anthropic':
      if (!anthropicKey) throw missingKey('anthropic', 'ANTHROPIC_API_KEY')
      return createAnthropicProvider(anthropicKey)

    case 'gemini':
      if (!geminiKey) throw missingKey('gemini', 'GEMINI_API_KEY')
      return createGeminiProvider(geminiKey)

    case undefined:
    case '':
      break

    default:
      console.warn(`[generate] Unknown EMAIL_PROVIDER "${requested}" — falling back to auto-select.`)
  }

  if (geminiKey) return createGeminiProvider(geminiKey)
  if (anthropicKey) return createAnthropicProvider(anthropicKey)

  console.warn('[generate] No AI credentials found — falling back to the offline provider.')
  return createMockProvider()
}

function missingKey(provider: string, variable: string): Error {
  return new Error(`EMAIL_PROVIDER=${provider} requires ${variable} to be set`)
}
