import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGenerate } from '../server/generate-handler.js'
import { requestUrl, toWebRequest, writeWebResponse } from '../server/http-adapter.js'

/**
 * Vercel Function (Node runtime).
 *
 * Node rather than edge. The edge runtime would suit a streaming endpoint, and
 * nothing in the current dependency set rules it out — but this configuration
 * is the one verified end to end in production, and swapping runtimes is not a
 * change worth making untested. The Node runtime streams fine and the handler
 * is identical either way.
 */
export const config = { runtime: 'nodejs' }

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = requestUrl(req, '/api/generate')
  const response = await handleGenerate(await toWebRequest(req, url), process.env)
  await writeWebResponse(res, response)
}
