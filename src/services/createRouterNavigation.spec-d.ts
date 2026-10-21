import { test } from 'vitest'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'

test('loader state and value lookups only accept loader locations', () => {
  const navigation = createRouterNavigation()
  const route = createResolvedRoute(createRoute({ path: '/' }))

  navigation.getLoaderState({ kind: 'loader', id: route.id, name: 'default' }, route)
  navigation.getLoaderValue({ kind: 'loader', id: route.id, name: 'default' }, route)

  // @ts-expect-error view props are not loader state
  navigation.getLoaderState({ kind: 'props', id: route.id, name: 'default' }, route)
  // @ts-expect-error view props are not loader values
  navigation.getLoaderValue({ kind: 'props', id: route.id, name: 'default' }, route)
})
