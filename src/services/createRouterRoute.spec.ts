import { expect, test, vi } from 'vitest'
import { createRouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { mockResolvedRoute, mockRoute } from '@/utilities/testHelpers'

test('isRouteRoute returns correct response', () => {
  const resolved = mockResolvedRoute(mockRoute(''), [])
  const push = vi.fn()

  const route = createRouterRoute(resolved, push)

  expect(isRouterRoute(route)).toBe(true)
  expect(isRouterRoute({})).toBe(false)
})