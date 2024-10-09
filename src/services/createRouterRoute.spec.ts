import { expect, test, vi } from 'vitest'
import { reactive } from 'vue'
import { createRouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { mockResolvedRoute, mockRoute } from '@/utilities/testHelpers'

test('isRouterRoute returns correct response', () => {
  const resolved = mockResolvedRoute(mockRoute('isRouterRoute'), [])
  const push = vi.fn()

  const route = createRouterRoute(reactive(resolved), push)

  expect(isRouterRoute(route)).toBe(true)
  expect(isRouterRoute({})).toBe(false)
})

test('sending state, includes state in push options', () => {
  const resolved = mockResolvedRoute(mockRoute('state'), [])
  const push = vi.fn()

  const route = createRouterRoute(reactive(resolved), push)

  route.update({}, { state: { foo: 'foo' } })

  expect(push).toBeCalledWith(
    'state',
    {},
    { state: { foo: 'foo' } },
  )

  route.update('param', 123, { state: { bar: 'bar' } })

  expect(push).toBeCalledWith(
    'state',
    { param: 123 },
    { state: { bar: 'bar' } },
  )
})