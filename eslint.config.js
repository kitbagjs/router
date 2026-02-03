import config from '@kitbag/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      '@typescript-eslint/no-confusing-void-expression': ['off'],
      '@typescript-eslint/only-throw-error': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
    },
  },
  {
    files: ['**/*.spec-d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['off'],
    },
  },
]
