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
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          environment: 'happy-dom',
          include: ['src/**/*.browser.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/**/*.browser.spec.ts'],
          typecheck: {
            enabled: true,
            checker: 'vue-tsc',
            ignoreSourceErrors: true,
            tsconfig: './tsconfig.json',
            include: ['src/**/*.spec-d.ts'],
          },
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
      external: ['vue', 'zod', /^node:/],
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
