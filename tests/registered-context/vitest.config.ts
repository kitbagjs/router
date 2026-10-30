import { defineConfig } from 'vitest/config'

// Register augmentation needs its own TypeScript compilation so it cannot
// change the unregistered router types asserted by the source test suite.
export default defineConfig({
  test: {
    name: 'registered-context',
    include: [],
    typecheck: {
      enabled: true,
      only: true,
      checker: 'vue-tsc',
      // Source types are checked separately without this Register augmentation.
      ignoreSourceErrors: true,
      tsconfig: './tests/registered-context/tsconfig.json',
      include: ['tests/registered-context/**/*.spec-d.ts'],
    },
  },
})
