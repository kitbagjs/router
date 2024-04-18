import { expect, test } from 'vitest'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRoutes } from '@/utilities/createRouterRoutes'
import { routes } from '@/utilities/testHelpers'

test('given a url returns that string', () => {
  const routerRoutes = createRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  expect(resolve('/bar')).toBe('/bar')
})

test('given a route key with params returns the url', () => {
  const routerRoutes = createRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  expect(resolve('parentA', { paramA: 'bar' })).toBe('/bar')
})

test('given a route key and a query appends query to the url', () => {
  const routerRoutes = createRoutes(routes)

  const resolve = createRouterResolve(routerRoutes)
  const url = resolve('parentA', { paramA: 'bar' }, { query: { foo: 'foo' } })

  expect(url).toBe('/bar?foo=foo')
})

test('given a route key with params cannot be matched, throws an error', () => {
  const routerRoutes = createRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  // @ts-expect-error
  expect(() => resolve({ route: 'foo' })).toThrowError()
})