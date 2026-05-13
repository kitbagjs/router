import { expect, test } from 'vitest'
import { getInitialUrl } from '@/services/getInitialUrl'

test('throws error if initial route is not set', () => {
  expect(() => getInitialUrl()).toThrow('initialUrl must be set if window.location is unavailable')
})
