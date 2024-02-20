import { expect, test, vi } from 'vitest'
import { RouterRoute, Route, Routes } from '@/types'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import * as utilities from '@/utilities/routeMatchScore'
import { component } from '@/utilities/testHelpers'

test('given path WITHOUT params, returns match', () => {
  const routes = [
    {
      name: 'parent',
      path: '/parent',
      children: [
        {
          name: 'child',
          path: '/child',
          children: [
            {
              name: 'grandchild',
              path: '/grandchild',
              component,
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes

  const routerRoutes = createRouterRoutes(routes)
  const match = getResolvedRouteForUrl(routerRoutes, '/parent/child/grandchild')

  expect(match?.name).toBe('grandchild')
})

test('given path to unnamed parent, without option to get to leaf, returns undefined', () => {
  const routes = [
    {
      path: '/unnamed',
      children: [
        {
          name: 'unnamed-child',
          path: '/unnamed-child/:child-id',
          children: [
            {
              name: 'namedGrandchild',
              path: '/named-grandchild',
              component,
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes

  const routerRoutes = createRouterRoutes(routes)
  const match = getResolvedRouteForUrl(routerRoutes, '/unnamed')

  expect(match).toBeUndefined()
})

test('given path to unnamed  parent, with option to get to leaf, returns available leaf', () => {
  const routes = [
    {
      path: '/unnamed',
      children: [
        {
          name: 'unnamed-child-root',
          path: '',
          component,
        },
      ],
    },
  ] as const satisfies Routes

  const routerRoutes = createRouterRoutes(routes)
  const match = getResolvedRouteForUrl(routerRoutes, '/unnamed')

  expect(match?.name).toBe('unnamed-child-root')
})

test('given path that includes named parent and path to leaf, return first match', () => {
  const routes = [
    {
      name: 'namedParent',
      path: '/named-parent',
      children: [
        {
          name: 'namedChild',
          path: '',
          children: [
            {
              name: 'namedGrandchild',
              path: '',
              component,
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes

  const routerRoutes = createRouterRoutes(routes)
  const match = getResolvedRouteForUrl(routerRoutes, '/named-parent')

  expect(match?.name).toBe('namedGrandchild')
})

test('given route with simple string param WITHOUT value present, returns undefined', () => {
  const routes: Routes = [
    {
      name: 'simple-params',
      path: '/simple/:simple',
      component,
    },
  ]

  const routerRoutes = createRouterRoutes(routes)
  const response = getResolvedRouteForUrl(routerRoutes, '/simple/')

  expect(response).toBeUndefined()
})

test('given route with simple string query param WITHOUT value present, returns undefined', () => {
  const routes: Routes = [
    {
      name: 'simple-params',
      path: '/missing',
      query: 'simple=:simple',
      component,
    },
  ]

  const routerRoutes = createRouterRoutes(routes)
  const response = getResolvedRouteForUrl(routerRoutes, '/missing?without=params')

  expect(response).toBeUndefined()
})


test('given route with equal matches, returns route with highest score', () => {
  vi.spyOn(utilities, 'getRouteScoreSortMethod').mockImplementation(() => {
    return (route: RouterRoute) => {
      return route.name === 'second-route' ? -1 : +1
    }
  })

  const routes = [
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
  ] as const satisfies Routes

  const routerRoutes = createRouterRoutes(routes)
  const response = getResolvedRouteForUrl(routerRoutes, '/')

  expect(response?.name).toBe('second-route')
})

test('given a route without params or query returns an empty params and query', () => {
  const route = {
    name: 'route',
    path: '/',
    component,
  } as const satisfies Route

  const routerRoutes = createRouterRoutes([route])
  const response = getResolvedRouteForUrl(routerRoutes, '/')

  expect(response?.params).toMatchObject({})
  expect(response?.query).toMatchObject({})
})

test('given a url with a query returns all query values', () => {
  const route = {
    name: 'route',
    path: '/',
    component,
  } as const satisfies Route

  const routerRoutes = createRouterRoutes([route])
  const response = getResolvedRouteForUrl(routerRoutes, '/?foo=foo1&foo=foo2&bar=bar&baz')

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
  const route = {
    name: 'route',
    path: '/:paramA',
    query: 'paramB=:paramB',
    component,
  } as const satisfies Route

  const routerRoutes = createRouterRoutes([route])
  const response = getResolvedRouteForUrl(routerRoutes, '/A?paramB=B')

  expect(response?.params).toMatchObject({
    paramA: 'A',
    paramB: 'B',
  })
})
