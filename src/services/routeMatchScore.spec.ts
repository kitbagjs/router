import { describe, expect, test } from 'vitest'
import { createRoutes } from '@/services/createRoutes'
import { countExpectedQueryParams, getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { component } from '@/utilities/testHelpers'

describe('countExpectedQueryKeys', () => {
  test('given route without query, returns 0', () => {
    const [route] = createRoutes([
      {
        name: 'without-query',
        path: '/',
        component,
      },
    ])
    const actualQuery = new URLSearchParams('/?can=have&some=queries')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(0)
  })

  test('given route with query where url has keys but different values, still counts as present', () => {
    const [route] = createRoutes([
      {
        name: 'different-values',
        path: '/',
        query: 'value=blue',
        component,
      },
    ])
    const actualQuery = new URLSearchParams('value=red')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(1)
  })

  test('given route with query all included in url in any order, returns count of route queries', () => {
    const [route] = createRoutes([
      {
        name: 'all-satisfied',
        path: '/',
        query: 'one=1&two=2&three=3&four=4',
        component,
      },
    ])
    const actualQuery = new URLSearchParams('three=3&one=1&four=4&two=2')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(4)
  })

  test('given route with query with some missing from url, returns count not missing', () => {
    const [route] = createRoutes([
      {
        name: 'some-missing',
        path: '/',
        query: 'one=1&two=2&three=3&four=4',
        component,
      },
    ])
    const actualQuery = new URLSearchParams('one=1&three=3')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(2)
  })
})

describe('getRouteScoreSortMethod', () => {
  test('given routes with different path scores, returns them sorted by path score descending', () => {
    const [aRoute, bRoute] = createRoutes([
      {
        name: 'lower-path',
        path: '[?color]',
        component,
      },
      {
        name: 'higher-path',
        path: '[?color]/[?id]',
        component,
      },
    ])

    const sortByRouteScore = getRouteScoreSortMethod('/red/123')
    const response = [aRoute, bRoute].sort(sortByRouteScore)

    expect(response).toMatchObject([bRoute, aRoute])
  })

  test('given routes with equal path scores, returns them sorted by route depth descending', () => {
    const routes = createRoutes([
      {
        name: 'lower-depth',
        path: '/[?color]',
        component,
      },
      {
        name: 'higher-depth',
        path: '/',
        children: createRoutes([
          {
            name: 'higher-depth-child',
            path: '[?color]',
            component,
          },
        ]),
      },
    ])

    const sortByRouteScore = getRouteScoreSortMethod('/red')
    const response = routes.sort(sortByRouteScore)

    expect(response.map(route => route.matched.name)).toMatchObject(['higher-depth-child', 'lower-depth', 'higher-depth'])
  })

  test('given routes with different query scores, returns them sorted by query score descending', () => {
    const [aRoute, bRoute] = createRoutes([
      {
        name: 'lower-query',
        path: '/',
        query: 'color=red',
        component,
      },
      {
        name: 'higher-query',
        path: '/',
        query: 'color=red&id=1',
        component,
      },
    ])

    const sortByRouteScore = getRouteScoreSortMethod('/?color=red&id=1&extra=ok')
    const response = [aRoute, bRoute].sort(sortByRouteScore)

    expect(response).toMatchObject([bRoute, aRoute])
  })

  test('given routes with equal query scores, returns them sorted by route depth descending', () => {
    const routes = createRoutes([
      {
        name: 'lower-depth',
        path: '/',
        query: 'color=red',
        component,
      },
      {
        name: 'higher-depth',
        path: '/',
        children: createRoutes([
          {
            name: 'higher-depth-child',
            path: '',
            query: 'color=red',
            component,
          },
        ]),
      },
    ])

    const sortByRouteScore = getRouteScoreSortMethod('/?color=red&extra=ok')
    const response = routes.sort(sortByRouteScore)

    expect(response.map(route => route.matched.name)).toMatchObject(['higher-depth-child', 'lower-depth', 'higher-depth'])
  })
})