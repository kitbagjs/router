import { expect, test } from 'vitest'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

test('does nothing when the window is not available', () => {
  expect(() => updateBrowserUrl('http://example.com2/foo')).not.toThrowError()
})