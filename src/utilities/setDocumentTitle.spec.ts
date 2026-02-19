import { expect, test } from 'vitest'
import { setDocumentTitle } from './setDocumentTitle'

test('when isBrowser returns false, does nothing', () => {
  expect(() => setDocumentTitle('test')).not.toThrow()
})
