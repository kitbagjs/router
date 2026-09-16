import { expect, test } from 'vitest'
import { isRouterPayload } from '@/services/payload'

test('a payload may carry the rejection the server rendered', () => {
  expect(isRouterPayload({ url: '/', rejection: 'NotFound', values: [] })).toBe(true)
  expect(isRouterPayload({ url: '/', rejection: null, values: [] })).toBe(true)
  expect(isRouterPayload({ url: '/', values: [] })).toBe(true)
  expect(isRouterPayload({ url: '/', rejection: 404, values: [] })).toBe(false)
})
