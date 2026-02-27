import { expect, test } from 'vitest'
import { setDocumentTitle } from './setDocumentTitle'

test('when isBrowser returns true, sets the document title', () => {
  setDocumentTitle('test')
  expect(document.title).toBe('test')
})
