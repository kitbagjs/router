import { expect, test, vi } from 'vitest'
import { reactive } from 'vue'
import { createRouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { createRouter } from './createRouter'
import { component } from '@/utilities/testHelpers'

test('isRouterRoute returns correct response', () => {
  const route = createRoute({ name: 'isRouterRoute' })
  const resolved = { ...createResolvedRoute(route, {}), data: undefined }
  const push = vi.fn()
  const routerKey = Symbol()

  const routerRoute = createRouterRoute(routerKey, reactive(resolved), push)

  expect(isRouterRoute(routerKey, routerRoute)).toBe(true)
  expect(isRouterRoute(routerKey, {})).toBe(false)
})

test('sending state, includes state in push options', () => {
  const route = createRoute({ name: 'state' })
  const resolved = { ...createResolvedRoute(route, {}), data: undefined }
  const push = vi.fn()
  const routerKey = Symbol()

  const routerRoute = createRouterRoute(routerKey, reactive(resolved), push)

  routerRoute.update({}, { state: { foo: 'foo' } })

  expect(push).toHaveBeenCalledWith(
    'state',
    {},
    { state: { foo: 'foo' } },
  )

  routerRoute.update('param', 123, { state: { bar: 'bar' } })

  expect(push).toHaveBeenCalledWith(
    'state',
    { param: 123 },
    { state: { bar: 'bar' } },
  )
})

test('getTitle resolves the title of the current route', async () => {
  const home = createRoute({ name: 'home', path: '/', component })
  const other = createRoute({ name: 'other', path: '/other', component })

  home.setTitle(() => 'Home')
  other.setTitle(() => 'Other')

  const router = createRouter([home, other], { initialUrl: '/' })

  await router.start()

  await expect(router.route.getTitle()).resolves.toBe('Home')

  await router.push('other')

  await expect(router.route.getTitle()).resolves.toBe('Other')
})
