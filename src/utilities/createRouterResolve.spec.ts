import { expect, test, vi } from 'vitest'
import { createRouteMethods } from '@/utilities/createRouteMethods'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { routes } from '@/utilities/testHelpers'

test('when given a string returns that string', () => {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })

  expect(resolve('/bar')).toBe('/bar')
})

test('when given a route method returns the url', () => {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })
  const methods = createRouteMethods({ resolved, push: vi.fn() })

  expect(resolve(methods.parentA({ paramA: 'bar' }))).toBe('/bar')
})

test('when given a route with params returns the url', () => {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })

  expect(resolve({ route: 'parentA', params: { paramA: 'bar' } })).toBe('/bar')
})

test('throws an error if route with params cannot be matched', () => {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })

  expect(() => resolve({ route: 'foo' })).toThrowError()
})