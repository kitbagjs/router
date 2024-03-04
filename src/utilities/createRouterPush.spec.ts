import { expect, test, vi } from 'vitest'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { routes } from '@/utilities/testHelpers'

test('push calls onBeforeLocationUpdate and onAfterLocationUpdate', async () => {
  const onBeforeLocationUpdate = vi.fn(() => Promise.resolve(true))
  const onAfterLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate })
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const push = createRouterPush({ navigation, resolve })

  await push({ route: 'parentA', params: { paramA: '' } })

  expect(onBeforeLocationUpdate).toHaveBeenCalledWith('/')
  expect(onAfterLocationUpdate).toHaveBeenCalledWith('/')
})

test('push with query calls onBeforeLocationUpdate and onAfterLocationUpdate', async () => {
  const onBeforeLocationUpdate = vi.fn(() => Promise.resolve(true))
  const onAfterLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate })
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const push = createRouterPush({ navigation, resolve })

  await push({ route: 'parentB' }, { query: { foo: '123', bar: 'true' } })

  expect(onBeforeLocationUpdate).toHaveBeenCalledWith('/parentB?foo=123&bar=true')
  expect(onAfterLocationUpdate).toHaveBeenCalledWith('/parentB?foo=123&bar=true')
})