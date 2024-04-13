import { expect, test } from 'vitest'
import { resolve } from '@/utilities/createRouterResolve'
import { createRoutes } from '@/utilities/createRouterRoutes'
import { routes } from '@/utilities/testHelpers'

test('given a Url returns that string', () => {
  const routerRoutes = createRoutes(routes)

  expect(resolve(routerRoutes, '/bar')).toBe('/bar')
})

test.fails('given a Url with options returns that string with query added', () => {
  const routerRoutes = createRoutes(routes)

  expect(resolve(routerRoutes, '/bar', { query: { foo: 'zoo' } })).toBe('/bar?foo=zoo')
})

test('given a route with params returns the url', () => {
  const routerRoutes = createRoutes(routes)

  expect(resolve(routerRoutes, 'parentA', { paramA: 'bar' })).toBe('/bar')
})

test('given a route and a query appends query to the url', () => {
  const routerRoutes = createRoutes(routes)
  const url = resolve(routerRoutes, 'parentA', { paramA: 'bar' }, { query: { foo: 'foo' } })

  expect(url).toBe('/bar?foo=foo')
})

test('throws an error if route with params cannot be matched', () => {
  const routerRoutes = createRoutes(routes)

  // @ts-expect-error
  expect(() => resolve(routerRoutes, 'foo')).toThrowError()
})