import { expect, test, vi } from 'vitest'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { routes } from '@/utilities/testHelpers'

test('push calls onLocationUpdated', () => {
  const onLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onLocationUpdate })
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })
  const push = createRouterPush({ navigation, resolve })

  push({ route: 'parentA', params: { paramA: '' } })

  expect(onLocationUpdate).toHaveBeenCalledOnce()
})