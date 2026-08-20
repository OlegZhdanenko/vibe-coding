import { createGeminiProvider } from './gemini.js'
import { createMockProvider } from './mock.js'
import type { EmailProvider } from './types.js'

export type { EmailProvider } from './types.js'

export type ProviderId = 'gemini' | 'mock'

/**
 * Picks the provider for this deployment.
 *
 * `EMAIL_PROVIDER` forces a choice; otherwise the presence of a key decides,
 * and the offline writer is the floor so the app is never simply broken.
 *
 * Adding a provider is one more case below plus a file implementing
 * `EmailProvider`; nothing above this function changes. That is not a claim —
 * Gemini was added to a Claude-only codebase exactly that way, and Claude was
 * later removed the same way, both times without touching the prompt builder,
 * the parser, the streaming transport, the quota logic or any of their tests.
 */
export function resolveProvider(env: Record<string, string | undefined>): EmailProvider {
  const requested = env.EMAIL_PROVIDER?.trim().toLowerCase()
  const geminiKey = env.GEMINI_API_KEY?.trim()

  switch (requested) {
    case 'mock':
      return createMockProvider()

    case 'gemini':
      if (!geminiKey) {
        throw new Error('EMAIL_PROVIDER=gemini requires GEMINI_API_KEY to be set')
      }
      return createGeminiProvider(geminiKey)

    case undefined:
    case '':
      break

    default:
      console.warn(`[generate] Unknown EMAIL_PROVIDER "${requested}" — falling back to auto-select.`)
  }

  if (geminiKey) return createGeminiProvider(geminiKey)

  console.warn('[generate] No AI credentials found — falling back to the offline provider.')
  return createMockProvider()
}
