import { expect, test, vi } from 'vitest'
import { createRouterPush } from '@/utilities/createRouterPush'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { routes } from '@/utilities/testHelpers'

test('push calls onLocationUpdated', () => {
  const onLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onLocationUpdate })
  const resolved = resolveRoutes(routes)
  const push = createRouterPush<typeof routes>({ navigation, resolved })

  push({ route: 'parentA', params: { paramA: '' } })

  expect(onLocationUpdate).toHaveBeenCalledOnce()
})