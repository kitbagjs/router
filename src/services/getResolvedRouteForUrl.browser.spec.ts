import { afterEach, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getResolvedRouteForUrl } from '@/services/getResolvedRouteForUrl'
import * as utilities from '@/services/routeMatchScore'
import { Route } from '@/types'
import { component } from '@/utilities/testHelpers'

afterEach(() => {
  vi.restoreAllMocks()
})

test('given path WITHOUT params, returns match', () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
  })

  const child = createRoute({
    parent: parent,
    name: 'parent.child',
    path: '/child',
  })

  const grandchild = createRoute({
    parent: child,
    name: 'parent.child.grandchild',
    path: '/grandchild',
    component,
  })

  const routes = [parent, child, grandchild]

  const match = getResolvedRouteForUrl(routes, '/parent/child/grandchild')

  expect(match?.name).toBe('parent.child.grandchild')
  expect(match?.matched.name).toBe('parent.child.grandchild')
})

test('given path to unnamed parent, without option to get to leaf, returns undefined', () => {
  const unnamedParent = createRoute({
    path: '/unnamed',
  })

  const unnamedChild = createRoute({
    parent: unnamedParent,
    path: '/unnamed-child/[child-id]',
  })

  const namedGrandchild = createRoute({
    parent: unnamedChild,
    path: '/named-grandchild',
    component,
  })

  const routes = [unnamedParent, unnamedChild, namedGrandchild]

  const match = getResolvedRouteForUrl(routes, '/unnamed')

  expect(match).toBeUndefined()
})

test('given path to unnamed  parent, with option to get to leaf, returns available leaf', () => {
  const unnamedParent = createRoute({
    path: '/unnamed',
  })

  const unnamedChildRoot = createRoute({
    parent: unnamedParent,
    name: 'child-root',
    component,
  })

  const routes = [unnamedChildRoot, unnamedParent]
  const match = getResolvedRouteForUrl(routes, '/unnamed')

  expect(match?.name).toBe('child-root')
})

test('given path that includes named parent and path to leaf, return first match', () => {
  const namedParent = createRoute({
    name: 'namedParent',
    path: '/named-parent',
  })

  const namedChild = createRoute({
    parent: namedParent,
    name: 'namedParent.namedChild',
  })

  const namedGrandchild = createRoute({
    parent: namedChild,
    name: 'namedParent.namedChild.namedGrandchild',
    component,
  })

  const routes = [namedParent, namedChild, namedGrandchild]
  const match = getResolvedRouteForUrl(routes, '/named-parent')

  expect(match?.name).toBe('namedParent.namedChild.namedGrandchild')
  expect(match?.matched.name).toBe('namedParent.namedChild.namedGrandchild')
})

test('given route with simple string param WITHOUT value present, returns undefined', () => {
  const route = createRoute({
    name: 'simple-params',
    path: '/simple/[simple]',
    component,
  })
  const response = getResolvedRouteForUrl([route], '/simple/')

  expect(response).toBeUndefined()
})

test('given route with simple string query param WITHOUT value present, returns undefined', () => {
  const route = createRoute({
    name: 'simple-params',
    path: '/missing',
    query: 'simple=[simple]',
    component,
  })
  const response = getResolvedRouteForUrl([route], '/missing?without=params')

  expect(response).toBeUndefined()
})

test('given route with equal matches, returns route with highest score', () => {
  vi.spyOn(utilities, 'getRouteScoreSortMethod').mockImplementation(() => {
    return (route: Route) => {
      return route.name === 'second-route' ? -1 : +1
    }
  })

  const routes = [
    createRoute({
      name: 'first-route',
      path: '/',
      component,
    }),
    createRoute({
      name: 'second-route',
      path: '/',
      component,
    }),
    createRoute({
      name: 'third-route',
      path: '/',
      component,
    }),
  ]

  const response = getResolvedRouteForUrl(routes, '/')

  expect(response?.name).toBe('second-route')
})

test('given a route without params or query returns an empty params and query', () => {
  const route = createRoute({
    name: 'route',
    path: '/',
    component,
  })
  const response = getResolvedRouteForUrl([route], '/')

  expect(response?.params).toMatchObject({})
  expect(response?.query).toMatchObject({})
})

test('given a url with a query returns all query values', () => {
  const route = createRoute({
    name: 'route',
    path: '/',
    component,
  })
  const response = getResolvedRouteForUrl([route], '/?foo=foo1&foo=foo2&bar=bar&baz')

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
  const response = getResolvedRouteForUrl([route], '/A?paramB=B')

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

  const response = getResolvedRouteForUrl(routes, '/foo', { foo: 'true', bar: 'abc' })

  expect(response?.state).toMatchObject({ foo: true, bar: 'abc' })
})

test('given a url with hash, returns hash property', () => {
  const route = createRoute({
    name: 'route',
    path: '/foo',
    component,
  })
  const response = getResolvedRouteForUrl([route], '/foo#bar')

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

  const response = getResolvedRouteForUrl([noHashRoute, matchingRoute, differentHashRoute], '/foo#foo')

  expect(response?.name).toBe('matching-route')
})
