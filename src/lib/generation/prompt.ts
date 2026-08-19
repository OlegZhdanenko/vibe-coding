import {
  LENGTHS,
  TONES,
  type GenerateEmailInput,
  type GeneratedEmail,
  type LengthId,
  type ToneId,
} from './types.js'

/**
 * Prompt construction and response parsing, kept pure and provider-agnostic so
 * they can be unit tested without touching the network, and reused unchanged if
 * the model behind the endpoint is swapped.
 *
 * Everything under `lib/generation` is imported by the serverless handler as
 * well as the browser, so it uses relative imports only — the `@/` alias is a
 * Vite/tsconfig concern the server bundle does not share.
 */

const TONE_DIRECTIONS: Record<ToneId, string> = {
  professional: 'Neutral and competent. No slang, no exclamation marks.',
  friendly: 'Warm and personable, but still well organised.',
  formal: 'Ceremonious and precise. Full salutations, no contractions.',
  casual: 'Relaxed and conversational, the way colleagues actually write.',
  persuasive: 'Build a short case, then make one clear ask.',
  apologetic: 'Take responsibility plainly, state the fix, do not grovel.',
  enthusiastic: 'Upbeat and energetic. At most one exclamation mark.',
  empathetic: 'Acknowledge the situation first, then move gently to the point.',
  direct: 'Get to the point in the first sentence. Cut every optional word.',
}

const LENGTH_DIRECTIONS: Record<LengthId, string> = {
  short: 'Roughly 60–90 words, two to three sentences. No section headings.',
  medium: 'Roughly 120–180 words across two or three short paragraphs.',
  long: 'Roughly 250–350 words. Use short paragraphs, and a bullet list only if it genuinely helps.',
}

export const SYSTEM_PROMPT = [
  'You are an expert email writer. You turn a rough description into a message that is ready to send.',
  '',
  'Rules:',
  '- Return the subject line first, on a single line, prefixed exactly with "Subject: ".',
  '- Then one blank line, then the email body.',
  '- Never wrap the output in markdown code fences, and never add commentary before or after.',
  '- Use square-bracket placeholders such as [Name] only when a detail is genuinely missing.',
  '- Do not invent facts, figures, dates, or commitments that were not provided.',
  '- Write the whole message, including the subject, in the requested language.',
  '- End with an appropriate sign-off.',
].join('\n')

export function buildUserPrompt(input: GenerateEmailInput): string {
  const tone = TONES.find((item) => item.id === input.tone)
  const length = LENGTHS.find((item) => item.id === input.length)

  const lines = [
    `Write an email about the following:`,
    input.topic.trim(),
    '',
    `Language: ${input.language}`,
    `Tone: ${tone?.label ?? input.tone} — ${TONE_DIRECTIONS[input.tone]}`,
    `Length: ${length?.label ?? input.length} — ${LENGTH_DIRECTIONS[input.length]}`,
  ]

  const recipient = input.recipient?.trim()
  if (recipient) {
    lines.push(`Recipient: ${recipient}. Pitch the wording for this reader.`)
  }

  return lines.join('\n')
}

// Asterisks are allowed on either side of the colon: models bold the label as
// `**Subject:**` about as often as `**Subject**:`.
const SUBJECT_PATTERN = /^\s*\*{0,2}\s*subject\s*\*{0,2}\s*[::]\s*\*{0,2}\s*(.+?)\s*\*{0,2}\s*$/i

/**
 * Split the model output into a subject and a body.
 *
 * The prompt asks for a `Subject:` first line, but a parser that assumes the
 * model always complies would drop the entire email on the rare miss. When no
 * subject line is present, the whole output becomes the body and the subject
 * falls back to the topic.
 */
export function parseGeneratedEmail(raw: string, fallbackSubject = 'Your email'): GeneratedEmail {
  const cleaned = stripCodeFences(raw).trim()
  const [firstLine = '', ...rest] = cleaned.split('\n')

  const match = SUBJECT_PATTERN.exec(firstLine)
  if (!match) {
    return { subject: truncate(fallbackSubject, 120), body: cleaned }
  }

  return {
    subject: truncate(match[1]!.trim().replace(/^["']|["']$/g, ''), 200),
    body: rest.join('\n').trim(),
  }
}

/** Models occasionally wrap output in ``` despite instructions. */
function stripCodeFences(text: string): string {
  const fenced = /^\s*```(?:[a-z]*)\n([\s\S]*?)\n?```\s*$/i.exec(text)
  return fenced ? fenced[1]! : text
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

/** Token ceiling per length bucket — enough headroom to finish the thought. */
export function maxTokensFor(length: LengthId): number {
  switch (length) {
    case 'short':
      return 600
    case 'medium':
      return 1200
    case 'long':
      return 2000
  }
}
