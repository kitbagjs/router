import { afterEach, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { getMatchesForUrl } from '@/services/getMatchesForUrl'
import * as utilities from '@/services/routeMatchScore'
import { Route } from '@/types/route'
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

  const [match] = getMatchesForUrl(routes, '/parent/child/grandchild')

  expect(match.name).toBe('parent.child.grandchild')
  expect(match.matched.name).toBe('parent.child.grandchild')
})

test('given path to unnamed parent, without option to get to leaf, returns no matches', () => {
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

  const match = getMatchesForUrl(routes, '/unnamed')

  expect(match).toMatchObject([])
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
  const [match] = getMatchesForUrl(routes, '/unnamed')

  expect(match.name).toBe('child-root')
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
  const [match] = getMatchesForUrl(routes, '/named-parent')

  expect(match.name).toBe('namedParent.namedChild.namedGrandchild')
  expect(match.matched.name).toBe('namedParent.namedChild.namedGrandchild')
})

test('given route with simple string param WITHOUT value present, returns no matches', () => {
  const route = createRoute({
    name: 'simple-params',
    path: '/simple/[simple]',
    component,
  })
  const response = getMatchesForUrl([route], '/simple/')

  expect(response).toMatchObject([])
})

test('given route with simple string query param WITHOUT value present, returns no matches', () => {
  const route = createRoute({
    name: 'simple-params',
    path: '/missing',
    query: 'simple=[simple]',
    component,
  })
  const response = getMatchesForUrl([route], '/missing?without=params')

  expect(response).toMatchObject([])
})

test('given route with equal matches, returns route with highest score', () => {
  vi.spyOn(utilities, 'getRouteScoreSortMethod').mockImplementation(() => {
    return (route: Route) => {
      return route.name === 'second-route' ? -1 : 1
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

  const [match] = getMatchesForUrl(routes, '/')

  expect(match.name).toBe('second-route')
})

test.each([
  ['/same-path', 'internal'],
  ['https://kitbag.dev/same-path', 'external'],
])('given two routes with the same path but different host, returns the route with matching host', (url, expectedMatchName) => {
  const externalRoute = createExternalRoute({
    name: 'external',
    path: '/same-path',
    host: 'https://kitbag.dev',
  })

  const internalRoute = createRoute({
    name: 'internal',
    path: '/same-path',
  })

  const [match] = getMatchesForUrl([externalRoute, internalRoute], url)
  const [reversedMatch] = getMatchesForUrl([internalRoute, externalRoute], url)

  expect(match.name).toBe(expectedMatchName)
  expect(reversedMatch.name).toBe(expectedMatchName)
})
