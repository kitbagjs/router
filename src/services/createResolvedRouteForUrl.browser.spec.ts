import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRouteForUrl } from '@/services/createResolvedRouteForUrl'
import { component } from '@/utilities/testHelpers'

test('given a url with a query returns all query values', () => {
  const route = createRoute({
    name: 'route',
    path: '/',
    component,
  })
  const response = createResolvedRouteForUrl([route], '/?foo=foo1&foo=foo2&bar=bar&baz')

  expect(response?.query.get('foo')).toBe('foo1')
  expect(response?.query.getAll('foo')).toMatchObject(['foo1', 'foo2'])
  expect(response?.query.get('bar')).toBe('bar')
  expect(response?.query.getAll('bar')).toMatchObject(['bar'])
  expect(response?.query.get('baz')).toBe('')
  expect(response?.query.getAll('baz')).toMatchObject([''])
  expect(response?.query.get('does-not-exist')).toBe(null)
  expect(response?.query.getAll('does-not-exist')).toMatchObject([])
})

test('given a route with params returns all params', () => {
  const route = createRoute({
    name: 'route',
    path: '/[paramA]',
    query: 'paramB=[paramB]',
    component,
  })
  const response = createResolvedRouteForUrl([route], '/A?paramB=B')

  expect(response?.params).toMatchObject({
    paramA: 'A',
    paramB: 'B',
  })
})

test('given state that matches state params, returns state', () => {
  const parent = createRoute({
    name: 'parent',
    state: { foo: Boolean },
  })

  const child = createRoute({
    parent,
    name: 'foo',
    path: '/foo',
    component,
    state: { bar: String },
  })

  const routes = [parent, child] as const

  const response = createResolvedRouteForUrl(routes, '/foo', { foo: 'true', bar: 'abc' })

  expect(response?.state).toMatchObject({ foo: true, bar: 'abc' })
})

test('given a url with hash, returns hash property', () => {
  const route = createRoute({
    name: 'route',
    path: '/foo',
    component,
  })

  const response = createResolvedRouteForUrl([route], '/foo#bar')

  expect(response?.hash).toBe('#bar')
})

test('given a route with hash, matches url with same hash', () => {
  const noHashRoute = createRoute({
    name: 'no-hash',
    path: '/foo',
    component,
  })
  const differentHashRoute = createRoute({
    name: 'different-hash',
    path: '/foo',
    component,
    hash: 'bar',
  })
  const matchingRoute = createRoute({
    name: 'matching-route',
    path: '/foo',
    component,
    hash: 'foo',
  })

  const response = createResolvedRouteForUrl([noHashRoute, matchingRoute, differentHashRoute], '/foo#foo')

  expect(response?.name).toBe('matching-route')
})
