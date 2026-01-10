import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { countExpectedQueryParams, getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { component } from '@/utilities/testHelpers'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createDiscoveredRoute } from '@/services/createDiscoveredRoute'

describe('countExpectedQueryKeys', () => {
  test('given route without query, returns 0', () => {
    const route = createRoute({
      name: 'without-query',
      path: '/',
      component,
    })
    const actualQuery = new URLSearchParams('/?can=have&some=queries')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(0)
  })

  test('given route with query where url has keys but different values, still counts as present', () => {
    const route = createRoute({
      name: 'different-values',
      path: '/',
      query: 'value=blue',
      component,
    })
    const actualQuery = new URLSearchParams('value=red')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(1)
  })

  test('given route with query all included in url in any order, returns count of route queries', () => {
    const route = createRoute({
      name: 'all-satisfied',
      path: '/',
      query: 'one=1&two=2&three=3&four=4',
      component,
    })
    const actualQuery = new URLSearchParams('three=3&one=1&four=4&two=2')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(4)
  })

  test('given route with query with some missing from url, returns count not missing', () => {
    const route = createRoute({
      name: 'some-missing',
      path: '/',
      query: 'one=1&two=2&three=3&four=4',
      component,
    })
    const actualQuery = new URLSearchParams('one=1&three=3')

    const response = countExpectedQueryParams(route, actualQuery)

    expect(response).toBe(2)
  })
})

describe('getRouteScoreSortMethod', () => {
  test('given routes with different path scores, returns them sorted by path score descending', () => {
    const aRoute = createRoute({
      name: 'lower-path',
      path: '[?color]',
      component,
    })
    const bRoute = createRoute({
      name: 'higher-path',
      path: '[?color]/[?id]',
      component,
    })

    const sortByRouteScore = getRouteScoreSortMethod('/red/123')
    const expected = [bRoute, aRoute]

    expect([aRoute, bRoute].sort(sortByRouteScore)).toMatchObject(expected)
    expect([bRoute, aRoute].sort(sortByRouteScore)).toMatchObject(expected)
  })

  test('given routes with equal path scores, returns them sorted by route depth descending', () => {
    const lowerRoute = createRoute({
      name: 'lower-depth',
      path: '/[?color]',
      component,
    })

    const higherRoute = createRoute({
      name: 'higher-depth',
      path: '/',
    })

    const higherRouteChild = createRoute({
      parent: higherRoute,
      name: 'higher-depth-child',
      path: '[?color]',
      component,
    })

    const routes = [lowerRoute, higherRoute, higherRouteChild]

    const sortByRouteScore = getRouteScoreSortMethod('/red')
    const response = routes.sort(sortByRouteScore)
    const matchNames = response.map((route) => route.matched.name)

    expect(matchNames).toMatchObject(['higher-depth-child', 'lower-depth', 'higher-depth'])
  })

  test('given routes with different query scores, returns them sorted by query score descending', () => {
    const aRoute = createRoute({
      name: 'lower-query',
      path: '/',
      query: 'color=red',
      component,
    })
    const bRoute = createRoute({
      name: 'higher-query',
      path: '/',
      query: 'color=red&id=1',
      component,
    })

    const sortByRouteScore = getRouteScoreSortMethod('/?color=red&id=1&extra=ok')
    const expected = [bRoute, aRoute]

    expect([aRoute, bRoute].sort(sortByRouteScore)).toMatchObject(expected)
    expect([bRoute, aRoute].sort(sortByRouteScore)).toMatchObject(expected)
  })

  test('given routes that are otherwise equal, prefers routes with matching host', () => {
    const externalRoute = createExternalRoute({
      name: 'external',
      path: '/same-path',
      host: 'https://kitbag.dev',
    })

    const internalRoute = createRoute({
      name: 'internal',
      path: '/same-path',
    })

    const sortByRouteScore = getRouteScoreSortMethod('https://kitbag.dev/same-path')
    const expected = [externalRoute, internalRoute]

    expect([externalRoute, internalRoute].sort(sortByRouteScore)).toMatchObject(expected)
    expect([internalRoute, externalRoute].sort(sortByRouteScore)).toMatchObject(expected)
  })

  test('given routes that are otherwise equal, prefers routes with matching hash', () => {
    const aRoute = createRoute({
      name: 'implicit-hash',
      path: '/same-path',
      component,
    })

    const bRoute = createRoute({
      name: 'explicit-hash',
      path: '/same-path',
      hash: '#123',
    })

    const sortByRouteScore = getRouteScoreSortMethod('/same-path#123')
    const expected = [bRoute, aRoute]

    expect([aRoute, bRoute].sort(sortByRouteScore)).toMatchObject(expected)
    expect([bRoute, aRoute].sort(sortByRouteScore)).toMatchObject(expected)
  })

  test('given routes with equal query scores, returns them sorted by route depth descending', () => {
    const lowerRoute = createRoute({
      name: 'lower-depth',
      path: '/',
      query: 'color=red',
      component,
    })

    const higherRoute = createRoute({
      name: 'higher-depth',
      path: '/',
    })

    const higherRouteChild = createRoute({
      parent: higherRoute,
      name: 'higher-depth-child',
      query: 'color=red',
      component,
    })

    const routes = [
      lowerRoute,
      higherRoute,
      higherRouteChild,
    ]

    const sortByRouteScore = getRouteScoreSortMethod('/?color=red&extra=ok')
    const response = routes.sort(sortByRouteScore)

    expect(response.map((route) => route.matched.name)).toMatchObject(['higher-depth-child', 'lower-depth', 'higher-depth'])
  })
})
