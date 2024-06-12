import { describe, expect, test } from 'vitest'
import { createRoutes } from '@/services/createRoutes'
import { path } from '@/services/path'
import { query } from '@/services/query'
import { generateRoutePathRegexPattern, generateRouteQueryRegexPatterns, getParamName } from '@/services/routeRegex'
import { withDefault } from '@/services/withDefault'
import { component } from '@/utilities/testHelpers'

describe('generateRoutePathRegexPattern', () => {
  test('given path without params, returns unmodified value with start and end markers', () => {
    const [route] = createRoutes([
      {
        name: 'path-without-params',
        path: 'parent/child/grandchild',
        component,
      },
    ])

    const result = generateRoutePathRegexPattern(route)

    const expected = new RegExp(`^${route.path}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with params, returns value with params replaced with catchall', () => {
    const [route] = createRoutes([
      {
        name: 'path-with-params',
        path: 'parent/child/[childParam]/grand-child/[grandChild123]',
        component,
      },
    ])

    const result = generateRoutePathRegexPattern(route)

    const catchAll = '.+'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with optional params, returns value with params replaced with catchall', () => {
    const [route] = createRoutes([
      {
        name: 'path-with-optional-params',
        path: 'parent/child/[?childParam]/grand-child/[?grandChild123]',
        component,
      },
    ])

    const result = generateRoutePathRegexPattern(route)

    const catchAll = '.*'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })


  test('given path with default params, returns value with params replaced with catchall', () => {
    const [route] = createRoutes([
      {
        name: 'path-with-default-params',
        path: path('parent/child/[?childParam]/grand-child/[?grandChild123]', { childParam: withDefault(String, 'abc'), grandChild123: withDefault(String, 'def') }),
        component,
      },
    ])

    const result = generateRoutePathRegexPattern(route)

    const catchAll = '.*'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })
})

describe('generateRouteQueryRegexPatterns', () => {
  test('given query without params, returns unmodified value with start and end markers', () => {
    const [route] = createRoutes([
      {
        name: 'query-without-params',
        path: 'query',
        component,
      },
    ])

    const result = generateRouteQueryRegexPatterns(route)

    expect(result).toMatchObject([])
  })

  test('given query with required params, returns value with params replaced with catchall', () => {
    const [route] = createRoutes([
      {
        name: 'query-with-params',
        path: 'query',
        query: 'dynamic=[first]&static=params&another=[second]',
        component,
      },
    ])

    const result = generateRouteQueryRegexPatterns(route)

    const catchAll = '([^/]+)'
    expect(result).toMatchObject([new RegExp(`dynamic=${catchAll}`), new RegExp('static=params'), new RegExp(`dynamic=${catchAll}`)])
  })

  test('given query with optional params, returns value without params', () => {
    const [route] = createRoutes([
      {
        name: 'query-with-optional-params',
        path: 'query',
        query: 'dynamic=[?first]&static=params&another=[?second]',
        component,
      },
    ])

    const result = generateRouteQueryRegexPatterns(route)

    expect(result).toMatchObject([new RegExp('static=params')])
  })

  test('given query with default params, returns value without params', () => {
    const [route] = createRoutes([
      {
        name: 'query-with-default-params',
        path: 'query',
        query: query('dynamic=[?first]&static=params&another=[?second]', { first: withDefault(String, 'abc'), second: withDefault(String, 'abc') }),
        component,
      },
    ])

    const result = generateRouteQueryRegexPatterns(route)

    expect(result).toMatchObject([new RegExp('static=params')])
  })
})

describe('getParamName', () => {
  test('given string with optional param name syntax, returns param name', () => {
    const paramName = 'foo'

    const response = getParamName(`[?${paramName}]`)

    expect(response).toBe(paramName)
  })

  test('given string with param name syntax, returns param name', () => {
    const paramName = 'foo'

    const response = getParamName(`[${paramName}]`)

    expect(response).toBe(paramName)
  })

  test.each([
    ['foo'],
    ['?foo'],
    ['?:*foo'],
  ])('given string that is not param syntax, returns undefined', (paramName) => {
    const response = getParamName(paramName)

    expect(response).toBe(undefined)
  })
})