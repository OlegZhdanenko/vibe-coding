import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Bridges Node's `IncomingMessage`/`ServerResponse` to the Web `Request` and
 * `Response` types the generation handler is written against.
 *
 * All three Node-based hosts use this: the Vercel function, the Vite dev
 * middleware, and the standalone server in the Docker image. Keeping one copy
 * means a streaming or header bug is fixed once rather than three times.
 */

export async function toWebRequest(req: IncomingMessage, url: URL): Promise<Request> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }

  const method = req.method ?? 'GET'
  const hasBody = method !== 'GET' && method !== 'HEAD' && chunks.length > 0

  return new Request(url, {
    method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  })
}

export async function writeWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()))

  if (!response.body) {
    res.end()
    return
  }

  const reader = response.body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
      // Push each frame out immediately; without this the platform may buffer
      // the whole stream and the draft would appear all at once at the end.
      res.flushHeaders?.()
    }
  } finally {
    res.end()
  }
}

/** Reconstruct the request URL, which Node exposes only as a path. */
export function requestUrl(req: IncomingMessage, fallbackPath = '/'): URL {
  const host = req.headers.host ?? 'localhost'
  const protocol = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'http'
  return new URL(req.url || fallbackPath, `${protocol}://${host}`)
}
