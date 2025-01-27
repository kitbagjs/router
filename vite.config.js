import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    typecheck: {
      checker: 'vue-tsc',
      ignoreSourceErrors: true,
      include: ['src/**/*.spec-d.ts'],
    },
    include: ['src/**/*.spec.ts'],
    environmentMatchGlobs: [
      ['**\/*.browser.spec.ts', 'happy-dom'],
      ['**\/*.spec.ts', 'node'],
    ],
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: '@kitbag/router',
      fileName: 'kitbag-router',
    },
    rollupOptions: {
      external: ['vue', 'zod'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
    }),
  ],
})
