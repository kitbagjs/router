import { expect, test, vi } from 'vitest'
import { Route } from '@/types'
import { createRoutes } from '@/utilities/createRouterRoutes'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import * as utilities from '@/utilities/routeMatchScore'
import { component } from '@/utilities/testHelpers'

test('given path WITHOUT params, returns match', () => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/parent',
      children: createRoutes([
        {
          name: 'child',
          path: '/child',
          children: createRoutes([
            {
              name: 'grandchild',
              path: '/grandchild',
              component,
            },
          ]),
        },
      ]),
    },
  ])

  const match = getResolvedRouteForUrl(routes, '/parent/child/grandchild')

  expect(match?.name).toBe('parent.child.grandchild')
  expect(match?.matched.name).toBe('grandchild')
})

test('given path to unnamed parent, without option to get to leaf, returns undefined', () => {
  const routes = createRoutes([
    {
      path: '/unnamed',
      children: createRoutes([
        {
          name: 'unnamed-child',
          path: '/unnamed-child/:child-id',
          children: createRoutes([
            {
              name: 'namedGrandchild',
              path: '/named-grandchild',
              component,
            },
          ]),
        },
      ]),
    },
  ])

  const match = getResolvedRouteForUrl(routes, '/unnamed')

  expect(match).toBeUndefined()
})

test('given path to unnamed  parent, with option to get to leaf, returns available leaf', () => {
  const routes = createRoutes([
    {
      path: '/unnamed',
      children: createRoutes([
        {
          name: 'unnamed-child-root',
          path: '',
          component,
        },
      ]),
    },
  ])
  const match = getResolvedRouteForUrl(routes, '/unnamed')

  expect(match?.name).toBe('unnamed-child-root')
})

test('given path that includes named parent and path to leaf, return first match', () => {
  const routes = createRoutes([
    {
      name: 'namedParent',
      path: '/named-parent',
      children: createRoutes([
        {
          name: 'namedChild',
          path: '',
          children: createRoutes([
            {
              name: 'namedGrandchild',
              path: '',
              component,
            },
          ]),
        },
      ]),
    },
  ])

  const match = getResolvedRouteForUrl(routes, '/named-parent')

  expect(match?.name).toBe('namedParent.namedChild.namedGrandchild')
  expect(match?.matched.name).toBe('namedGrandchild')
})

test('given route with simple string param WITHOUT value present, returns undefined', () => {
  const routes = createRoutes([
    {
      name: 'simple-params',
      path: '/simple/:simple',
      component,
    },
  ])
  const response = getResolvedRouteForUrl(routes, '/simple/')

  expect(response).toBeUndefined()
})

test('given route with simple string query param WITHOUT value present, returns undefined', () => {
  const routes = createRoutes([
    {
      name: 'simple-params',
      path: '/missing',
      query: 'simple=:simple',
      component,
    },
  ])
  const response = getResolvedRouteForUrl(routes, '/missing?without=params')

  expect(response).toBeUndefined()
})


test('given route with equal matches, returns route with highest score', () => {
  vi.spyOn(utilities, 'getRouteScoreSortMethod').mockImplementation(() => {
    return (route: Route) => {
      return route.name === 'second-route' ? -1 : +1
    }
  })

  const routes = createRoutes([
    {
      name: 'first-route',
      path: '/',
      component,
    },
    {
      name: 'second-route',
      path: '/',
      component,
    },
    {
      name: 'third-route',
      path: '/',
      component,
    },
  ])

  const response = getResolvedRouteForUrl(routes, '/')

  expect(response?.name).toBe('second-route')
})

test('given a route without params or query returns an empty params and query', () => {
  const routes = createRoutes([
    {
      name: 'route',
      path: '/',
      component,
    },
  ])
  const response = getResolvedRouteForUrl(routes, '/')

  expect(response?.params).toMatchObject({})
  expect(response?.query).toMatchObject({})
})

test('given a url with a query returns all query values', () => {
  const routes = createRoutes([
    {
      name: 'route',
      path: '/',
      component,
    },
  ])
  const response = getResolvedRouteForUrl(routes, '/?foo=foo1&foo=foo2&bar=bar&baz')

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
  const routes = createRoutes([
    {
      name: 'route',
      path: '/:paramA',
      query: 'paramB=:paramB',
      component,
    },
  ])
  const response = getResolvedRouteForUrl(routes, '/A?paramB=B')

  expect(response?.params).toMatchObject({
    paramA: 'A',
    paramB: 'B',
  })
})
