import { expect, test } from 'vitest'
import { isBrowser } from '@/utilities/isBrowser'

test('isBrowser returns false when environment is node', () => {
  expect(isBrowser()).toBe(false)
})
