import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { isSameResolvedRoute } from '@/utilities/isSameResolvedRoute'
import { withParams } from '@/services/withParams'

const route = createRoute({ name: 'route', path: withParams('/route/[id]', { id: String }) })
const otherRoute = createRoute({ name: 'other', path: withParams('/route/[id]', { id: String }) })

test('given separately resolved routes with the same url, returns true', () => {
  expect(isSameResolvedRoute(createResolvedRoute(route, { id: '1' }), createResolvedRoute(route, { id: '1' }))).toBe(true)
})

test('given routes with different urls, returns false', () => {
  expect(isSameResolvedRoute(createResolvedRoute(route, { id: '1' }), createResolvedRoute(route, { id: '2' }))).toBe(false)
})

test('given different routes with the same url, returns false', () => {
  expect(isSameResolvedRoute(createResolvedRoute(route, { id: '1' }), createResolvedRoute(otherRoute, { id: '1' }))).toBe(false)
})

test('given no routes, returns true', () => {
  expect(isSameResolvedRoute(undefined, undefined)).toBe(true)
})

test('given only one route, returns false', () => {
  expect(isSameResolvedRoute(createResolvedRoute(route, { id: '1' }), undefined)).toBe(false)
})
