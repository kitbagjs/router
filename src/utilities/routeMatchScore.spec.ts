import { describe, expect, test } from 'vitest'
import { Route, Routes } from '@/types'
import { createRouterRoutes, countExpectedQueryKeys, component, getRouteScoreSortMethod } from '@/utilities'

describe('countExpectedQueryKeys', () => {
  test('given route without query, returns 0', () => {
    const route = {
      name: 'without-query',
      path: '/',
      component,
    } as const satisfies Route
    const [routerRoutes] = createRouterRoutes([route])
    const actualQuery = new URLSearchParams('/?can=have&some=queries')

    const response = countExpectedQueryKeys(routerRoutes, actualQuery)

    expect(response).toBe(0)
  })

  test('given route with query where url has keys but different values, still counts as present', () => {
    const route = {
      name: 'different-values',
      path: '/',
      query: 'value=blue',
      component,
    } as const satisfies Route
    const [routerRoutes] = createRouterRoutes([route])
    const actualQuery = new URLSearchParams('value=red')

    const response = countExpectedQueryKeys(routerRoutes, actualQuery)

    expect(response).toBe(1)
  })

  test('given route with query all included in url in any order, returns count of route queries', () => {
    const route = {
      name: 'all-satisfied',
      path: '/',
      query: 'one=1&two=2&three=3&four=4',
      component,
    } as const satisfies Route
    const [routerRoutes] = createRouterRoutes([route])
    const actualQuery = new URLSearchParams('three=3&one=1&four=4&two=2')

    const response = countExpectedQueryKeys(routerRoutes, actualQuery)

    expect(response).toBe(4)
  })

  test('given route with query with some missing from url, returns count not missing', () => {
    const route = {
      name: 'some-missing',
      path: '/',
      query: 'one=1&two=2&three=3&four=4',
      component,
    } as const satisfies Route
    const [routerRoutes] = createRouterRoutes([route])
    const actualQuery = new URLSearchParams('one=1&three=3')

    const response = countExpectedQueryKeys(routerRoutes, actualQuery)

    expect(response).toBe(2)
  })
})

describe('getRouteScoreSortMethod', () => {
  test('given routes with different query scores, returns them sorted by query score descending', () => {
    const routes = [
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
    ] as const satisfies Routes

    const [aRoute, bRoute] = createRouterRoutes(routes)

    const sortByRouteScore = getRouteScoreSortMethod('/?color=red&id=1&extra=ok')
    const response = [aRoute, bRoute].sort(sortByRouteScore)

    expect(response).toMatchObject([bRoute, aRoute])
  })

  test('given routes with equal query scores, returns them sorted by route depth descending', () => {
    const routes = [
      {
        name: 'lower-depth',
        path: '/',
        query: 'color=red',
        component,
      },
      {
        name: 'higher-depth',
        path: '/',
        children: [
          {
            name: 'higher-depth-child',
            path: '',
            query: 'color=red',
            component,
          },
        ],
      },
    ] as const satisfies Routes

    const [aRoute, bRoute] = createRouterRoutes(routes)

    const sortByRouteScore = getRouteScoreSortMethod('/?color=red&extra=ok')
    const response = [aRoute, bRoute].sort(sortByRouteScore)

    expect(response).toMatchObject([bRoute, aRoute])
  })
})