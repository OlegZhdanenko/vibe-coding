import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGenerate } from '../server/generate-handler.js'
import { requestUrl, toWebRequest, writeWebResponse } from '../server/http-adapter.js'

/**
 * Vercel Function (Node runtime).
 *
 * The edge runtime would be the natural fit for a streaming endpoint, but the
 * Anthropic SDK pulls in `node:fs` and `node:path`, which edge rejects. Rather
 * than drop the official SDK for hand-rolled HTTP, this runs on Node and adapts
 * the request and response — the Node runtime streams fine, and the handler
 * itself is unchanged.
 */
export const config = { runtime: 'nodejs' }

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = requestUrl(req, '/api/generate')
  const response = await handleGenerate(await toWebRequest(req, url), process.env)
  await writeWebResponse(res, response)
}
