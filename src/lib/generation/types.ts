/**
 * The generation contract, shared verbatim by the browser and the serverless
 * handler. Both sides validate against the same lists, so an unknown tone can
 * never reach the model.
 */

/**
 * Ids are declared as literal tuples because `z.enum` needs a tuple to infer a
 * union; the descriptor lists below are checked against them at compile time.
 */
export const TONE_IDS = [
  'professional',
  'friendly',
  'formal',
  'casual',
  'persuasive',
  'apologetic',
  'enthusiastic',
  'empathetic',
  'direct',
] as const

export const LENGTH_IDS = ['short', 'medium', 'long'] as const

export type ToneId = (typeof TONE_IDS)[number]
export type LengthId = (typeof LENGTH_IDS)[number]

export const TONES: readonly { id: ToneId; label: string; hint: string }[] = [
  { id: 'professional', label: 'Professional', hint: 'Neutral, competent, workplace-safe' },
  { id: 'friendly', label: 'Friendly', hint: 'Warm and approachable, still tidy' },
  { id: 'formal', label: 'Formal', hint: 'Ceremonious, for clients and officials' },
  { id: 'casual', label: 'Casual', hint: 'Relaxed, for teammates you know well' },
  { id: 'persuasive', label: 'Persuasive', hint: 'Builds a case and asks for the yes' },
  { id: 'apologetic', label: 'Apologetic', hint: 'Owns the mistake without grovelling' },
  { id: 'enthusiastic', label: 'Enthusiastic', hint: 'Upbeat, for good news and launches' },
  { id: 'empathetic', label: 'Empathetic', hint: 'Careful, for sensitive situations' },
  { id: 'direct', label: 'Direct', hint: 'Blunt and brief, no preamble' },
]

export const LENGTHS: readonly { id: LengthId; label: string; hint: string; words: string }[] = [
  { id: 'short', label: 'Short', hint: '2–3 sentences', words: '60–90 words' },
  { id: 'medium', label: 'Medium', hint: '2–3 paragraphs', words: '120–180 words' },
  { id: 'long', label: 'Long', hint: 'Detailed, with structure', words: '250–350 words' },
]

export const LANGUAGES = [
  'English',
  'Ukrainian',
  'Spanish',
  'German',
  'French',
  'Polish',
] as const

export type LanguageId = (typeof LANGUAGES)[number]

export interface GenerateEmailInput {
  topic: string
  tone: ToneId
  length: LengthId
  language: LanguageId
  /** Optional "who is this to" hint, e.g. "my manager" or "a new client". */
  recipient?: string
}

export interface GeneratedEmail {
  subject: string
  body: string
}

/** Newline-delimited JSON frames sent by the generation endpoint. */
export type GenerationEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; email: GeneratedEmail; model: string; generationsUsed: number | null }
  | { type: 'error'; code: string; message: string }

export const MAX_TOPIC_LENGTH = 2000
export const MAX_RECIPIENT_LENGTH = 120
