import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { loaderDiscovery } from './plugin.mjs'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: [
      { find: '@kitbag/router', replacement: fileURLToPath(new URL('../../src/main.ts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('../../src', import.meta.url)) },
    ],
  },
  plugins: [loaderDiscovery({ routeFiles: ['routes.ts'] }), vue()],
  test: { environment: 'happy-dom', include: ['**/*.spec.ts'] },
})
