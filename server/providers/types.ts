import type { GenerateEmailInput } from '../../src/lib/generation/types.js'

/**
 * The seam between the app and whichever model writes the email.
 *
 * Everything above this interface — validation, quotas, streaming transport,
 * persistence, error mapping — is provider-agnostic. Swapping Claude for
 * another model, or for the offline stub, means adding one file that implements
 * `stream()` and registering it in `resolveProvider()`; nothing else changes.
 */
export interface EmailProvider {
  /** Stable identifier used in logs and in the `done` frame. */
  readonly id: string
  /** Model name recorded alongside each saved email. */
  readonly model: string
  /** Yields the message as incremental text chunks. */
  stream(input: GenerateEmailInput, signal?: AbortSignal): AsyncIterable<string>
}
