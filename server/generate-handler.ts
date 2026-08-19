import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppError, appError } from '../src/lib/errors'
import { parseGeneratedEmail } from '../src/lib/generation/prompt'
import { generateEmailSchema } from '../src/lib/generation/schema'
import type { GenerateEmailInput, GenerationEvent } from '../src/lib/generation/types'
import type { Database } from '../src/types/database'
import { resolveProvider } from './providers'

/** Generations allowed per month on the free plan. */
export const FREE_PLAN_LIMIT = 10

type Env = Record<string, string | undefined>

/**
 * Framework-agnostic generation endpoint.
 *
 * It takes a Web `Request` and returns a Web `Response`, which lets the exact
 * same function serve the Vercel Edge function in production and the Vite dev
 * middleware locally — no second implementation to keep in sync.
 *
 * The response is a stream of newline-delimited JSON frames rather than one
 * JSON body, so the dashboard can render the draft while it is still being
 * written. Errors that happen mid-stream are delivered as a final `error`
 * frame, because the HTTP status has already been sent by then.
 */
export async function handleGenerate(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return errorResponse(appError('not_found', { userMessage: 'Use POST for this endpoint.' }), 405)
  }

  try {
    const input = await parseBody(request)
    const auth = await authenticate(request, env)

    if (auth) {
      assertWithinQuota(auth.profile)
    }

    const provider = resolveProvider(env)
    const stream = buildStream({ provider, input, auth, signal: request.signal })

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        // Streaming responses must not be buffered by an intermediary proxy.
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    const appErr = error instanceof AppError ? error : appError('unknown', { cause: error })
    if (!(error instanceof AppError)) {
      console.error('[generate] Unhandled failure:', error)
    }
    return errorResponse(appErr, statusFor(appErr))
  }
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

async function parseBody(request: Request): Promise<GenerateEmailInput> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw appError('invalid_input', { userMessage: 'The request body must be valid JSON.' })
  }

  const parsed = generateEmailSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw appError('invalid_input', {
      userMessage: first?.message ?? 'Some of the details you entered are not valid.',
    })
  }

  const { topic, tone, length, language, recipient } = parsed.data
  return { topic, tone, length, language, recipient: recipient || undefined }
}

// ---------------------------------------------------------------------------
// Authentication and quota
// ---------------------------------------------------------------------------

interface AuthContext {
  userId: string
  profile: Pick<Database['public']['Tables']['profiles']['Row'], 'plan' | 'generations_used'>
  client: SupabaseClient<Database>
}

/**
 * Returns `null` only when the deployment explicitly opts into anonymous use.
 * Otherwise a valid bearer token is required — this endpoint spends money.
 */
async function authenticate(request: Request, env: Env): Promise<AuthContext | null> {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  const allowAnonymous = env.ALLOW_ANONYMOUS_GENERATION === 'true'

  if (!url || !(serviceKey || anonKey)) {
    if (allowAnonymous) return null
    throw appError('not_configured', {
      userMessage:
        'Generation is not configured on this deployment: Supabase credentials are missing.',
      status: 503,
    })
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    if (allowAnonymous) return null
    throw appError('unauthorized', { userMessage: 'Please sign in to generate emails.' })
  }

  // The service role key bypasses RLS, which is what lets the quota counter be
  // authoritative — a user must not be able to reset their own usage.
  const client = createClient<Database>(url, serviceKey ?? anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) {
    throw appError('unauthorized', { userMessage: 'Your session has expired. Please sign in again.' })
  }

  const { data: profile } = await client
    .from('profiles')
    .select('plan, generations_used')
    .eq('id', data.user.id)
    .maybeSingle()

  return {
    userId: data.user.id,
    profile: profile ?? { plan: 'free', generations_used: 0 },
    client,
  }
}

function assertWithinQuota(profile: AuthContext['profile']) {
  if (profile.plan !== 'free') return
  if (profile.generations_used < FREE_PLAN_LIMIT) return

  throw appError('quota_exceeded', {
    userMessage: `You have used all ${FREE_PLAN_LIMIT} generations on the free plan. Upgrade to keep writing.`,
    status: 402,
  })
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

interface StreamOptions {
  provider: ReturnType<typeof resolveProvider>
  input: GenerateEmailInput
  auth: AuthContext | null
  signal: AbortSignal
}

function buildStream({ provider, input, auth, signal }: StreamOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const send = (event: GenerationEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      let collected = ''

      try {
        for await (const chunk of provider.stream(input, signal)) {
          collected += chunk
          send({ type: 'delta', text: chunk })
        }

        const email = parseGeneratedEmail(collected, input.topic)

        // Persistence must not fail the generation the user already watched
        // being written, so a storage error is logged, not surfaced.
        const generationsUsed = auth
          ? await persist({ auth, input, email, model: provider.model })
          : null

        send({ type: 'done', email, model: provider.model, generationsUsed })
      } catch (error) {
        const appErr = error instanceof AppError ? error : appError('unknown', { cause: error })
        if (!(error instanceof AppError)) {
          console.error('[generate] Stream failed:', error)
        }
        send({ type: 'error', code: appErr.code, message: appErr.userMessage })
      } finally {
        controller.close()
      }
    },
  })
}

async function persist({
  auth,
  input,
  email,
  model,
}: {
  auth: AuthContext
  input: GenerateEmailInput
  email: { subject: string; body: string }
  model: string
}): Promise<number | null> {
  try {
    const { error: insertError } = await auth.client.from('emails').insert({
      user_id: auth.userId,
      topic: input.topic,
      tone: input.tone,
      length: input.length,
      language: input.language,
      recipient: input.recipient ?? null,
      subject: email.subject,
      body: email.body,
      model,
    })
    if (insertError) throw insertError

    const { data, error } = await auth.client.rpc('increment_generations_used', {
      target_user: auth.userId,
    })
    if (error) throw error

    return typeof data === 'number' ? data : auth.profile.generations_used + 1
  } catch (error) {
    console.error('[generate] Could not save the generation:', error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function statusFor(error: AppError): number {
  if (error.status) return error.status
  switch (error.code) {
    case 'invalid_input':
      return 400
    case 'unauthorized':
      return 401
    case 'quota_exceeded':
      return 402
    case 'forbidden':
      return 403
    case 'not_found':
      return 404
    case 'rate_limited':
      return 429
    case 'not_configured':
      return 503
    default:
      return 500
  }
}

function errorResponse(error: AppError, status: number): Response {
  const frame: GenerationEvent = {
    type: 'error',
    code: error.code,
    message: error.userMessage,
  }
  return new Response(JSON.stringify(frame), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' },
  })
}
