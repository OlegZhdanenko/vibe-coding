import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { handleGenerate } from './generate-handler'

/**
 * Serves `/api/generate` from the dev server.
 *
 * Without this you would need `vercel dev` to exercise generation locally. It
 * adapts Node's request/response objects to the Web types the handler uses, so
 * development and production run byte-for-byte the same handler.
 */
export function devApiPlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'inboxly:dev-api',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use('/api/generate', (req, res) => {
        void (async () => {
          try {
            const response = await handleGenerate(await toWebRequest(req), env)
            await writeNodeResponse(res, response)
          } catch (error) {
            console.error('[dev-api] Handler threw:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                type: 'error',
                code: 'unknown',
                message: 'The local API handler failed. See the terminal for details.',
              }),
            )
          }
        })()
      })
    },
  }
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
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

  return new Request(`http://localhost/api/generate`, {
    method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  })
}

async function writeNodeResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))

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
      // Defeat Node's write buffering so chunks reach the browser as they land.
      res.flushHeaders?.()
    }
  } finally {
    res.end()
  }
}
