import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    typecheck: {
      checker: 'vue-tsc',
      ignoreSourceErrors: true,
    },
    environmentMatchGlobs: [
      ['**\/*.browser.spec.ts', 'happy-dom'],
      ['**\/*.spec.ts', 'node'],
    ]
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
  },
  plugins: [
    vue(),
    dts({ 
      rollupTypes: true 
    })
  ],
  rollupOptions: {
    external: ['vue'],
    output: {
      globals: {
        vue: 'Vue',
      },
    },
  },
})