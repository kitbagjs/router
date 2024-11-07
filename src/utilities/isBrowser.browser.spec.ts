import { expect, test } from 'vitest'
import { isBrowser } from '@/utilities/isBrowser'

test('isBrowser returns true when environment is browser', () => {
  expect(isBrowser()).toBe(true)
})
