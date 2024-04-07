import { describe, expect, test } from 'vitest'
import { createRouterRoutes, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/utilities'
import { component } from '@/utilities/testHelpers'

describe('generateRoutePathRegexPattern', () => {
  test('given path without params, returns unmodified value with start and end markers', () => {
    const route = {
      name: 'path-without-params',
      path: 'parent/child/grandchild',
      component,
    }
    const [routerRoutes] = createRouterRoutes([route])

    const result = generateRoutePathRegexPattern(routerRoutes)

    const expected = new RegExp(`^${route.path}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with params, returns value with params replaced with catchall', () => {
    const route = {
      name: 'path-with-params',
      path: 'parent/child/:childParam/grand-child/:grandChild123',
      component,
    }
    const [routerRoutes] = createRouterRoutes([route])

    const result = generateRoutePathRegexPattern(routerRoutes)

    const catchAll = '[^/]+'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with optional params, returns value with params replaced with catchall', () => {
    const route = {
      name: 'path-with-optional-params',
      path: 'parent/child/:?childParam/grand-child/:?grandChild123',
      component,
    }
    const [routerRoutes] = createRouterRoutes([route])

    const result = generateRoutePathRegexPattern(routerRoutes)

    const catchAll = '[^/]*'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })
})

describe('generateRouteQueryRegexPatterns', () => {
  test('given query without params, returns unmodified value with start and end markers', () => {
    const route = {
      name: 'query-without-params',
      path: 'query',
      component,
    }
    const [routerRoutes] = createRouterRoutes([route])

    const result = generateRouteQueryRegexPatterns(routerRoutes)

    expect(result).toMatchObject([])
  })

  test('given query with params, returns value with params replaced with catchall', () => {
    const route = {
      name: 'query-with-params',
      path: 'query',
      query: 'dynamic=:first&static=params&another=:second',
      component,
    }
    const [routerRoutes] = createRouterRoutes([route])

    const result = generateRouteQueryRegexPatterns(routerRoutes)

    const catchAll = '([^/]+)'
    expect(result).toMatchObject([new RegExp(`dynamic=${catchAll}`), new RegExp('static=params'), new RegExp(`dynamic=${catchAll}`)])
  })

  test('given query with optional params, returns value with params replaced with catchall', () => {
    const route = {
      name: 'query-with-optional-params',
      path: 'query',
      query: 'dynamic=:?first&static=params&another=:?second',
      component,
    }
    const [routerRoutes] = createRouterRoutes([route])

    const result = generateRouteQueryRegexPatterns(routerRoutes)

    const catchAll = '([^/]*)'
    expect(result).toMatchObject([new RegExp(`dynamic=${catchAll}`), new RegExp('static=params'), new RegExp(`dynamic=${catchAll}`)])
  })
})