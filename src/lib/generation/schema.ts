import { z } from 'zod'
import {
  LANGUAGES,
  LENGTH_IDS,
  MAX_RECIPIENT_LENGTH,
  MAX_TOPIC_LENGTH,
  TONE_IDS,
} from './types.js'

/**
 * One schema, enforced on both sides: the form validates against it before
 * submitting, and the endpoint validates against it before spending a token.
 */
export const generateEmailSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(10, 'Describe the email in at least 10 characters')
    .max(MAX_TOPIC_LENGTH, `Keep the description under ${MAX_TOPIC_LENGTH} characters`),
  tone: z.enum(TONE_IDS),
  length: z.enum(LENGTH_IDS),
  language: z.enum(LANGUAGES),
  recipient: z
    .string()
    .trim()
    .max(MAX_RECIPIENT_LENGTH, 'That is too long for a recipient hint')
    .optional()
    .or(z.literal('')),
})

export type GenerateEmailFormValues = z.infer<typeof generateEmailSchema>
