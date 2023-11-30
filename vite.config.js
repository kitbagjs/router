import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
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