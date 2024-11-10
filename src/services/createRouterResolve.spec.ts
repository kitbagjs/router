import { expect, test } from 'vitest'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRoute } from '@/services/createRoute'
import { createRouterResolve } from '@/services/createRouterResolve'
import { component, routes } from '@/utilities/testHelpers'

test('given a url returns that string', () => {
  const resolve = createRouterResolve(routes)

  expect(resolve('/bar')).toBe('/bar')
})

test('given a route name with params, interpolates param values', () => {
  const resolve = createRouterResolve(routes)

  expect(resolve('parentA', { paramA: 'bar' })).toBe('/parentA/bar')
})

test('given a route name with query, interpolates param values', () => {
  const resolve = createRouterResolve(routes)
  const url = resolve('parentA', { paramA: 'bar' }, { query: { foo: 'foo' } })

  expect(url).toBe('/parentA/bar?foo=foo')
})

test('given a route name with params cannot be matched, throws an error', () => {
  const resolve = createRouterResolve(routes)

  // @ts-expect-error route doesn't actually exist
  expect(() => resolve({ route: 'foo' })).toThrowError()
})

test('given a param with a dash or underscore resolves the correct url', () => {
  const routes = [
    createRoute({
      name: 'kebab',
      path: '/[test-param]',
      component,
    }),
    createRoute({
      name: 'snake',
      path: '/[test_param]',
      component,
    }),
  ]

  const resolve = createRouterResolve(routes)

  const kebab = resolve('kebab', { 'test-param': 'foo' })

  expect(kebab).toBe('/foo')

  const snake = resolve('snake', { test_param: 'foo' })

  expect(snake).toBe('/foo')
})

test('when given an external route returns a fully qualified url', () => {
  const route = createExternalRoute({
    host: 'https://kitbag.dev',
    name: 'external',
    path: '/',
  })

  const resolve = createRouterResolve([route])

  const url = resolve('external')

  expect(url).toBe('https://kitbag.dev/')
})

test('when given an external route with params in host, interpolates param values', () => {
  const route = createExternalRoute({
    host: 'https://[subdomain].kitbag.dev',
    name: 'external',
    path: '/',
  })

  const resolve = createRouterResolve([route])

  const url = resolve('external', { subdomain: 'router' })

  expect(url).toBe('https://router.kitbag.dev/')
})

test('given a route with hash, interpolates hash value', () => {
  const resolve = createRouterResolve(routes)

  const url = resolve('parentA', { paramA: 'bar' }, { hash: 'foo' })

  expect(url).toBe('/parentA/bar#foo')
})
