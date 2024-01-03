import { expect, test } from 'vitest'
import { isBrowser } from '@/utilities/isBrowser'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

test('does nothing when the window is not available', () => {
  updateBrowserUrl('http://example.com2/foo')

  expect(isBrowser).toBe(false)
})