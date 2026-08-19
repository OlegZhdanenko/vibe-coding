import { describe, expect, it } from 'vitest'
import { SYSTEM_PROMPT, buildUserPrompt, maxTokensFor, parseGeneratedEmail } from './prompt.js'
import type { GenerateEmailInput } from './types.js'

const baseInput: GenerateEmailInput = {
  topic: 'Ask my manager for two days off next week',
  tone: 'professional',
  length: 'medium',
  language: 'English',
}

describe('buildUserPrompt', () => {
  it('includes the topic, language, tone and length directions', () => {
    const prompt = buildUserPrompt(baseInput)

    expect(prompt).toContain('Ask my manager for two days off next week')
    expect(prompt).toContain('Language: English')
    expect(prompt).toContain('Tone: Professional')
    expect(prompt).toContain('Length: Medium')
    // The length bucket must carry a concrete word target, not just a label.
    expect(prompt).toMatch(/120–180 words/)
  })

  it('omits the recipient line when none is given', () => {
    expect(buildUserPrompt(baseInput)).not.toContain('Recipient:')
  })

  it('includes the recipient when one is given', () => {
    const prompt = buildUserPrompt({ ...baseInput, recipient: 'my manager' })
    expect(prompt).toContain('Recipient: my manager')
  })

  it('ignores a recipient that is only whitespace', () => {
    const prompt = buildUserPrompt({ ...baseInput, recipient: '   ' })
    expect(prompt).not.toContain('Recipient:')
  })

  it('varies the directions by tone', () => {
    const direct = buildUserPrompt({ ...baseInput, tone: 'direct' })
    const formal = buildUserPrompt({ ...baseInput, tone: 'formal' })
    expect(direct).not.toEqual(formal)
  })
})

describe('SYSTEM_PROMPT', () => {
  it('specifies the subject-line contract the parser relies on', () => {
    expect(SYSTEM_PROMPT).toContain('Subject: ')
  })
})

describe('parseGeneratedEmail', () => {
  it('splits a well-formed response into subject and body', () => {
    const raw = 'Subject: Holiday request\n\nHi Marta,\n\nCould I take Thursday off?\n\nThanks'
    const result = parseGeneratedEmail(raw)

    expect(result.subject).toBe('Holiday request')
    expect(result.body).toBe('Hi Marta,\n\nCould I take Thursday off?\n\nThanks')
  })

  it('falls back to the topic when the model omits the subject line', () => {
    const raw = 'Hi Marta,\n\nCould I take Thursday off?'
    const result = parseGeneratedEmail(raw, 'Time off request')

    expect(result.subject).toBe('Time off request')
    // The whole output must survive; dropping it would lose the email.
    expect(result.body).toBe(raw)
  })

  it('strips code fences the model was told not to add', () => {
    const raw = '```\nSubject: Quarterly update\n\nHere is the summary.\n```'
    const result = parseGeneratedEmail(raw)

    expect(result.subject).toBe('Quarterly update')
    expect(result.body).toBe('Here is the summary.')
  })

  it('tolerates a bolded subject label', () => {
    const result = parseGeneratedEmail('**Subject:** Invoice 204\n\nPlease find it attached.')
    expect(result.subject).toBe('Invoice 204')
    expect(result.body).toBe('Please find it attached.')
  })

  it('removes wrapping quotes from the subject', () => {
    const result = parseGeneratedEmail('Subject: "Welcome aboard"\n\nGlad to have you.')
    expect(result.subject).toBe('Welcome aboard')
  })

  it('truncates an unreasonably long subject', () => {
    const long = 'x'.repeat(400)
    const result = parseGeneratedEmail(`Subject: ${long}\n\nBody`)

    expect(result.subject.length).toBeLessThanOrEqual(200)
    expect(result.subject.endsWith('…')).toBe(true)
  })

  it('handles an empty response without throwing', () => {
    const result = parseGeneratedEmail('', 'Fallback subject')
    expect(result.subject).toBe('Fallback subject')
    expect(result.body).toBe('')
  })
})

describe('maxTokensFor', () => {
  it('scales the ceiling with the requested length', () => {
    expect(maxTokensFor('short')).toBeLessThan(maxTokensFor('medium'))
    expect(maxTokensFor('medium')).toBeLessThan(maxTokensFor('long'))
  })
})
