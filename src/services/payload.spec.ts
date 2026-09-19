import { expect, test } from 'vitest'
import { isRouterPayload } from '@/services/payload'

test('a payload is one of the two kinds the server renders', () => {
  expect(isRouterPayload({ kind: 'reject', url: '/', rejection: 'NotFound' })).toBe(true)
  expect(isRouterPayload({ kind: 'success', url: '/', values: [] })).toBe(true)
  expect(isRouterPayload({ kind: 'reject', url: '/', rejection: 404 })).toBe(false)
  expect(isRouterPayload({ kind: 'success', url: '/' })).toBe(false)
  expect(isRouterPayload({ url: '/', values: [] })).toBe(false)
})
