import { expect, test, vi } from 'vitest'
import { createRouteMethods } from '@/utilities/createRouteMethods'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { routes } from '@/utilities/testHelpers'

test('given a string returns that string', () => {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  expect(resolve('/bar')).toBe('/bar')
})

test('given a route method returns the url', () => {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const methods = createRouteMethods({ routes: routerRoutes, push: vi.fn() })

  expect(resolve(methods.parentA({ paramA: 'bar' }))).toBe('/bar')
})

test('given a route with params returns the url', () => {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  expect(resolve({ route: 'parentA', params: { paramA: 'bar' } })).toBe('/bar')
})

test('given a route and a query appends query to the url', () => {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const url = resolve({ route: 'parentA', params: { paramA: 'bar' } }, { query: { foo: 'foo' } })

  expect(url).toBe('/bar?foo=foo')
})

test('throws an error if route with params cannot be matched', () => {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  expect(() => resolve({ route: 'foo' })).toThrowError()
})