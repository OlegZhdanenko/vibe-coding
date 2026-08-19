import { createAnthropicProvider } from './anthropic'
import { createMockProvider } from './mock'
import type { EmailProvider } from './types'

export type { EmailProvider } from './types'

/**
 * Picks the provider for this deployment.
 *
 * `EMAIL_PROVIDER` forces a choice (useful in tests and CI); otherwise the
 * presence of an API key decides. Adding a provider means one more case here.
 */
export function resolveProvider(env: Record<string, string | undefined>): EmailProvider {
  const requested = env.EMAIL_PROVIDER?.trim().toLowerCase()
  const apiKey = env.ANTHROPIC_API_KEY?.trim()

  if (requested === 'mock') return createMockProvider()

  if (requested === 'anthropic' || (!requested && apiKey)) {
    if (!apiKey) {
      throw new Error('EMAIL_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set')
    }
    return createAnthropicProvider(apiKey)
  }

  console.warn('[generate] No ANTHROPIC_API_KEY found — falling back to the offline provider.')
  return createMockProvider()
}
