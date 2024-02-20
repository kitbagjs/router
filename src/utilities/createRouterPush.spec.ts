import { expect, test, vi } from 'vitest'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { routes } from '@/utilities/testHelpers'

test('push calls onLocationUpdated', () => {
  const onLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onLocationUpdate })
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const push = createRouterPush({ navigation, resolve })

  push({ route: 'parentA', params: { paramA: '' } })

  expect(onLocationUpdate).toHaveBeenCalledOnce()
})