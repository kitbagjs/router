import { test } from 'vitest'
import { createRouteValueStore } from '@/services/createRouteValueStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'

test('loader state and value lookups only accept loader locations', () => {
  const store = createRouteValueStore()
  const route = createResolvedRoute(createRoute({ path: '/' }))

  store.getLoaderState({ kind: 'loader', id: route.id, name: 'default' }, route)
  store.getLoaderValue({ kind: 'loader', id: route.id, name: 'default' }, route)

  // @ts-expect-error view props are not loader state
  store.getLoaderState({ kind: 'props', id: route.id, name: 'default' }, route)
  // @ts-expect-error view props are not loader values
  store.getLoaderValue({ kind: 'props', id: route.id, name: 'default' }, route)
})
