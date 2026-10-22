import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(import.meta.dirname, 'src'),
      },
      // the package only declares a module entry, which node does not resolve
      {
        find: 'view-transitions-mock',
        replacement: resolve(import.meta.dirname, 'node_modules/view-transitions-mock/dist/index.js'),
      },
    ],
  },
  test: {
    onConsoleLog(log) {
      if (log.trim() === '<Suspense> is an experimental feature and its API will likely change.') {
        return false
      }
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          setupFiles: ['./vitest.setup.ts'],
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
      entry: resolve(import.meta.dirname, 'src/main.ts'),
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
      exclude: ['node_modules', 'dist', 'src/**/*.spec*.ts'],
    }),
  ],
})
