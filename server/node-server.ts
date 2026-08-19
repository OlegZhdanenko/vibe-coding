import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { handleGenerate } from './generate-handler.js'
import { requestUrl, toWebRequest, writeWebResponse } from './http-adapter.js'

/**
 * Self-hosted entry point: serves the built SPA and the generation endpoint
 * from one Node process. This is what the Docker image runs.
 *
 * It is the third host for the same `handleGenerate` function — after the
 * Vercel function and the Vite dev middleware — which is the point of
 * writing the handler against Web `Request`/`Response` rather than against a
 * particular framework.
 */

const PORT = Number(process.env.PORT ?? 8080)
const DIST = resolve(process.cwd(), 'dist')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = createServer((req, res) => {
  void route(req, res).catch((error: unknown) => {
    console.error('[server] Request failed:', error)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal server error')
  })
})

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = requestUrl(req)

  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (url.pathname === '/api/generate') {
    const response = await handleGenerate(await toWebRequest(req, url), process.env)
    await writeWebResponse(res, response)
    return
  }

  serveStatic(url.pathname, res)
}

function serveStatic(pathname: string, res: ServerResponse): void {
  // Normalise first so `..` segments cannot escape the dist directory.
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(DIST, relative)

  const filePath =
    candidate.startsWith(DIST) && existsSync(candidate) && statSync(candidate).isFile()
      ? candidate
      : join(DIST, 'index.html') // SPA fallback: the router owns unknown paths.

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }

  const isHtml = filePath.endsWith('.html')
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
    // Hashed assets are immutable; index.html must never be cached.
    'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
  })
  createReadStream(filePath).pipe(res)
}

server.listen(PORT, () => {
  console.log(`[server] Listening on http://0.0.0.0:${PORT}`)
})
