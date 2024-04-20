import { expect, test } from 'vitest'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRoutes } from '@/utilities/createRouterRoutes'
import { routeProps } from '@/utilities/testHelpers'

test('given a url returns that string', () => {
  const routes = createRoutes(routeProps)
  const resolve = createRouterResolve(routes)

  expect(resolve('/bar')).toBe('/bar')
})

test('given a route key with params returns the url', () => {
  const routes = createRoutes(routeProps)
  const resolve = createRouterResolve(routes)

  expect(resolve('parentA', { paramA: 'bar' })).toBe('/bar')
})

test('given a route key and a query appends query to the url', () => {
  const routes = createRoutes(routeProps)

  const resolve = createRouterResolve(routes)
  const url = resolve('parentA', { paramA: 'bar' }, { query: { foo: 'foo' } })

  expect(url).toBe('/bar?foo=foo')
})

test('given a route key with params cannot be matched, throws an error', () => {
  const routes = createRoutes(routeProps)
  const resolve = createRouterResolve(routes)

  // @ts-expect-error
  expect(() => resolve({ route: 'foo' })).toThrowError()
})