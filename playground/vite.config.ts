import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@kitbag/router', replacement: here('../src/main.ts') },
      { find: /^@\//, replacement: `${here('../src')}/` },
    ],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
