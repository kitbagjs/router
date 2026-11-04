import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'

test('default selection remains separate from subsequently added named loaders', () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'default')
    .addLoader(() => 42, { name: 'count' })
  const route = createResolvedRoute(definition)

  expect(getRouteLoaderLocation(route, 'default')).toEqual({ kind: 'loader', id: definition.id, name: 'default' })
  expect(getRouteLoaderLocation(route, 'count')).toEqual({ kind: 'loader', id: definition.id, name: 'count' })
})

test('selection uses only the supplied matches and rejects unavailable names', () => {
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent')
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const route = createResolvedRoute(child)
  const ancestors = route.matches.slice(0, 1)

  expect(getRouteLoaderLocation(route, 'default', ancestors)).toEqual({ kind: 'loader', id: parent.id, name: 'default' })
  expect(() => getRouteLoaderLocation(route, 'child', ancestors)).toThrow(TypeError)
  expect(() => getRouteLoaderLocation(route, 'missing')).toThrow(TypeError)
})
