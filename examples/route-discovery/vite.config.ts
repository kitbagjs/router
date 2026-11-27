import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import router from '@kitbag/router/vite'

export default defineConfig({
  root: import.meta.dirname,
  plugins: [router(), vue()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
})
