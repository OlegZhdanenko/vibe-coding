import { describe, expect, it } from 'vitest'
import type { GenerationEvent } from '../src/lib/generation/types.js'
import { handleGenerate } from './generate-handler.js'

/** Deployment with no Supabase and the offline provider — what CI runs. */
const ANONYMOUS_ENV = {
  EMAIL_PROVIDER: 'mock',
  ALLOW_ANONYMOUS_GENERATION: 'true',
}

const VALID_BODY = {
  topic: 'Ask my manager for two days off next week to move apartments',
  tone: 'professional',
  length: 'short',
  language: 'English',
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

async function readFrames(response: Response): Promise<GenerationEvent[]> {
  const text = await response.text()
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as GenerationEvent)
}

describe('handleGenerate', () => {
  it('rejects anything other than POST', async () => {
    const response = await handleGenerate(
      new Request('http://localhost/api/generate'),
      ANONYMOUS_ENV,
    )
    expect(response.status).toBe(405)
  })

  it('answers a CORS preflight', async () => {
    const response = await handleGenerate(
      new Request('http://localhost/api/generate', { method: 'OPTIONS' }),
      ANONYMOUS_ENV,
    )
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  it('rejects a body that is not valid JSON', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })

    const response = await handleGenerate(request, ANONYMOUS_ENV)
    expect(response.status).toBe(400)
  })

  it('rejects a topic that is too short', async () => {
    const response = await handleGenerate(post({ ...VALID_BODY, topic: 'hi' }), ANONYMOUS_ENV)
    const body = (await response.json()) as GenerationEvent

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ type: 'error', code: 'invalid_input' })
  })

  it('rejects a tone that is not in the catalogue', async () => {
    const response = await handleGenerate(
      post({ ...VALID_BODY, tone: 'sarcastic' }),
      ANONYMOUS_ENV,
    )
    expect(response.status).toBe(400)
  })

  it('streams deltas and finishes with a parsed email', async () => {
    const response = await handleGenerate(post(VALID_BODY), ANONYMOUS_ENV)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('ndjson')

    const frames = await readFrames(response)
    const deltas = frames.filter((frame) => frame.type === 'delta')
    const done = frames.at(-1)

    expect(deltas.length).toBeGreaterThan(1)
    expect(done?.type).toBe('done')

    if (done?.type !== 'done') throw new Error('expected a done frame')
    expect(done.email.subject).toContain('Ask my manager')
    expect(done.email.body.length).toBeGreaterThan(0)
    // The subject marker belongs to the wire format, not the body.
    expect(done.email.body).not.toContain('Subject:')
    expect(done.model).toBe('mock-writer-v1')
  })

  it('requires a bearer token when Supabase is configured', async () => {
    const response = await handleGenerate(post(VALID_BODY), {
      EMAIL_PROVIDER: 'mock',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    })

    const body = (await response.json()) as GenerationEvent
    expect(response.status).toBe(401)
    expect(body).toMatchObject({ code: 'unauthorized' })
  })

  it('reports a missing configuration instead of failing opaquely', async () => {
    const response = await handleGenerate(post(VALID_BODY), { EMAIL_PROVIDER: 'mock' })
    const body = (await response.json()) as GenerationEvent

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ code: 'not_configured' })
  })
})
