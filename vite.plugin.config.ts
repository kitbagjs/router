import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        vite: resolve(import.meta.dirname, 'src/vite/index.ts'),
        cli: resolve(import.meta.dirname, 'src/vite/cli.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entry) => `plugin/${entry}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.dependencies), 'vite', ...builtinModules, /^node:/],
    },
  },
})
