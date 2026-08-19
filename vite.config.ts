/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devApiPlugin } from './server/vite-dev-api'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix: the dev API needs the server-only vars too, which Vite would
  // otherwise withhold because they are not prefixed with VITE_.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), devApiPlugin({ ...process.env, ...env })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep the initial payload small: the vendor libraries change far
          // less often than app code, so they cache independently.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (/node_modules\/(react|react-dom|react-router)/.test(id)) return 'react'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('framer-motion')) return 'motion'
          },
        },
      },
    },
    test: {
      // Two environments, because the two halves of the codebase genuinely
      // differ: components need a DOM, and the Anthropic SDK refuses to
      // construct in a browser-like environment — correctly, since that would
      // mean an API key in a browser.
      projects: [
        {
          extends: true,
          test: {
            name: 'client',
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.test.{ts,tsx}'],
            css: true,
          },
        },
        {
          extends: true,
          test: {
            name: 'server',
            environment: 'node',
            globals: true,
            include: ['server/**/*.test.ts'],
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/components/ui/**'],
      },
    },
  }
})
