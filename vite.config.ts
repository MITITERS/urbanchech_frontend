import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The dev server proxies the API so the browser always talks to a single
  // origin: no CORS setup is needed and the same relative paths work in dev,
  // in Docker (target = the backend service on the Compose network) and in
  // production (nginx does the same proxying).
  const proxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      restoreMocks: true,
    },
    server: {
      host: true,
      port: 5173,
      // Bind mounts do not always deliver inotify events (macOS/Windows Docker);
      // set VITE_USE_POLLING=true there to keep hot reload working.
      watch:
        env.VITE_USE_POLLING === 'true'
          ? { usePolling: true, interval: 300 }
          : undefined,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/_allauth': { target: proxyTarget, changeOrigin: true },
        '/media': { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
