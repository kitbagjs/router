import { expect, test, vi } from 'vitest'
import { reactive } from 'vue'
import { createRouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'

test('isRouterRoute returns correct response', () => {
  const route = createRoute({ name: 'isRouterRoute' })
  const resolved = createResolvedRoute(route, {})
  const push = vi.fn()
  const routerKey = Symbol()

  const routerRoute = createRouterRoute(routerKey, reactive(resolved), push)

  expect(isRouterRoute(routerKey, routerRoute)).toBe(true)
  expect(isRouterRoute(routerKey, {})).toBe(false)
})

test('sending state, includes state in push options', () => {
  const route = createRoute({ name: 'state' })
  const resolved = createResolvedRoute(route, {})
  const push = vi.fn()
  const routerKey = Symbol()

  const routerRoute = createRouterRoute(routerKey, reactive(resolved), push)

  routerRoute.update({}, { state: { foo: 'foo' } })

  expect(push).toBeCalledWith(
    'state',
    {},
    { state: { foo: 'foo' } },
  )

  routerRoute.update('param', 123, { state: { bar: 'bar' } })

  expect(push).toBeCalledWith(
    'state',
    { param: 123 },
    { state: { bar: 'bar' } },
  )
})
