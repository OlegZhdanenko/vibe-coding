import type { Plugin } from 'vite'
import { handleGenerate } from './generate-handler.js'
import { requestUrl, toWebRequest, writeWebResponse } from './http-adapter.js'

/**
 * Serves `/api/generate` from the dev server.
 *
 * Without this you would need `vercel dev` to exercise generation locally. It
 * uses the same Node adapter as the deployed function, so development and
 * production run byte-for-byte the same handler.
 */
export function devApiPlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'inboxly:dev-api',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use('/api/generate', (req, res) => {
        void (async () => {
          try {
            const url = requestUrl(req, '/api/generate')
            const response = await handleGenerate(await toWebRequest(req, url), env)
            await writeWebResponse(res, response)
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
