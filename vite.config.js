import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
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
  test: {
    typecheck: {
      checker: 'vue-tsc',
      ignoreSourceErrors: true,
      include: ['src/**/*.spec-d.ts'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'browser-tests',
          environment: 'happy-dom',
          include: ['src/**/*.browser.spec.ts'],
          exclude: ['src/**/*.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node-tests',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/**/*.browser.spec.ts'],
        },
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
      insertTypesEntry: true,
    }),
  ],
})
