import { expect, test } from 'vitest'
import { createRouterResolve } from '@/services/createRouterResolve'
import { createRoutes } from '@/services/createRoutes'
import { component, routes } from '@/utilities/testHelpers'

test('given a url returns that string', () => {
  const resolve = createRouterResolve(routes)

  expect(resolve('/bar')).toBe('/bar')
})

test('given a route key with params returns the url', () => {
  const resolve = createRouterResolve(routes)

  expect(resolve('parentA', { paramA: 'bar' })).toBe('/parentA/bar')
})

test('given a route key and a query appends query to the url', () => {

  const resolve = createRouterResolve(routes)
  const url = resolve('parentA', { paramA: 'bar' }, { query: { foo: 'foo' } })

  expect(url).toBe('/parentA/bar?foo=foo')
})

test('given a route key with params cannot be matched, throws an error', () => {
  const resolve = createRouterResolve(routes)

  // @ts-expect-error
  expect(() => resolve({ route: 'foo' })).toThrowError()
})


test('given a param with a dash or underscore resolves the correct url', () => {
  const routes = createRoutes([
    {
      name: 'kebab',
      path: '/[test-param]',
      component,
    },
    {
      name: 'snake',
      path: '/[test_param]',
      component,
    },
  ])

  const resolve = createRouterResolve(routes)

  const kebab = resolve('kebab', { 'test-param': 'foo' })

  expect(kebab).toBe('/foo')

  const snake = resolve('snake', { 'test_param': 'foo' })

  expect(snake).toBe('/foo')
})