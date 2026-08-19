import { TONES } from '../../src/lib/generation/types.js'
import type { GenerateEmailInput } from '../../src/lib/generation/types.js'
import type { EmailProvider } from './types.js'

/**
 * Offline stand-in for the real model.
 *
 * It exists so the app is runnable and testable without an API key — local
 * development, CI, and the automated tests all use it. It is never selected
 * when `ANTHROPIC_API_KEY` is present.
 */
export function createMockProvider(): EmailProvider {
  return {
    id: 'mock',
    model: 'mock-writer-v1',

    async *stream(input: GenerateEmailInput, signal?: AbortSignal) {
      const text = composeMockEmail(input)

      // Emit in word-sized chunks so the UI's streaming path is exercised
      // exactly as it would be against the real provider.
      for (const chunk of text.match(/\S+\s*/g) ?? [text]) {
        if (signal?.aborted) return
        await new Promise((resolve) => setTimeout(resolve, 12))
        yield chunk
      }
    },
  }
}

function composeMockEmail(input: GenerateEmailInput): string {
  const topic = input.topic.trim()
  const toneLabel = TONES.find((tone) => tone.id === input.tone)?.label ?? input.tone
  const subject = topic.length > 60 ? `${topic.slice(0, 57).trimEnd()}…` : topic
  const greeting = input.recipient?.trim() ? `Hi ${input.recipient.trim()},` : 'Hi there,'

  const paragraphs = [
    `I am writing about ${lowerFirst(topic)}.`,
    input.length === 'short'
      ? 'Let me know if that works for you and I will take it from there.'
      : `Here is where things stand, and what I would suggest as the next step. I have kept this ${toneLabel.toLowerCase()} and to the point so it is easy to act on.`,
  ]

  if (input.length === 'long') {
    paragraphs.push(
      'If it would help, I am happy to walk through the details on a short call. Otherwise, a reply confirming the direction is all I need to move ahead.',
    )
  }

  return [
    `Subject: ${subject}`,
    '',
    greeting,
    '',
    ...paragraphs.flatMap((paragraph) => [paragraph, '']),
    'Best regards,',
    '[Your name]',
    '',
    '— Generated in offline mode. Set ANTHROPIC_API_KEY to use the real model.',
  ].join('\n')
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1)
}
