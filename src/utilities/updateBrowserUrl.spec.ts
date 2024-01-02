import { expect, test } from 'vitest'
import { globalExists } from '@/utilities/globalExists'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

test('does nothing when the window is not available', () => {
  updateBrowserUrl('http://example.com2/foo')

  expect(globalExists('window')).toBe(false)
  expect(globalExists('history')).toBe(false)
})