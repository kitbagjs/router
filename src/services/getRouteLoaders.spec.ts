import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getRouteLoaders } from '@/services/getRouteLoaders'

test('returns default and named loaders from the route and its ancestors', () => {
  const grandparent = createRoute({ path: '/grandparent' })
    .addLoader(() => 'default')
    .addLoader(() => 'ancestor', { name: 'ancestor' })
  const parent = createRoute({ parent: grandparent, path: '/parent' })
  const child = createRoute({ parent, path: '/child' })
    .addLoader(() => 'child', { name: 'child' })
  const route = createResolvedRoute(child)

  const loaders = getRouteLoaders(route)

  expect(Object.keys(loaders)).toEqual(['default', 'ancestor', 'child'])
  expect(loaders.default).toBe(route.matches[0].loaders.default)
  expect(loaders.ancestor).toBe(route.matches[0].loaders.ancestor)
  expect(loaders.child).toBe(route.matches[2].loaders.child)
})

test('returns an empty record for a route without loaders', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }))

  const loaders = getRouteLoaders(route)

  expect(loaders).toEqual({})
})
