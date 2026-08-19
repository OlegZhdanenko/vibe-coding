import { createAnthropicProvider } from './anthropic'
import { createGeminiProvider } from './gemini'
import { createMockProvider } from './mock'
import type { EmailProvider } from './types'

export type { EmailProvider } from './types'

export type ProviderId = 'anthropic' | 'gemini' | 'mock'

/**
 * Picks the provider for this deployment.
 *
 * `EMAIL_PROVIDER` forces a choice; otherwise the first available credential
 * wins, in descending order of output quality, and the offline writer is the
 * floor so the app is never simply broken. Adding a provider is one more entry
 * in the table below plus the file that implements the interface.
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

  if (anthropicKey) return createAnthropicProvider(anthropicKey)
  if (geminiKey) return createGeminiProvider(geminiKey)

  console.warn('[generate] No AI credentials found — falling back to the offline provider.')
  return createMockProvider()
}

function missingKey(provider: string, variable: string): Error {
  return new Error(`EMAIL_PROVIDER=${provider} requires ${variable} to be set`)
}
