import { handleGenerate } from '../server/generate-handler'

/**
 * Vercel Edge Function.
 *
 * The edge runtime speaks Web `Request`/`Response`, which is exactly the shape
 * `handleGenerate` expects — this file is only an adapter, so there is no
 * production-only logic that local development cannot exercise.
 */
export const config = { runtime: 'edge' }

export default function handler(request: Request): Promise<Response> {
  return handleGenerate(request, process.env as Record<string, string | undefined>)
}
