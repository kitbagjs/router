import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { generateRoutePathRegexPattern, generateRouteQueryRegexPatterns, getParamName, splitByMatches } from '@/services/routeRegex'
import { component } from '@/utilities/testHelpers'

describe('generateRoutePathRegexPattern', () => {
  test('given path without params, returns unmodified value with start and end markers', () => {
    const route = createRoute({
      name: 'path-without-params',
      path: 'parent/child/grandchild',
      component,
    })

    const result = generateRoutePathRegexPattern(route)

    const expected = new RegExp(`^${route.path}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with params, returns value with params replaced with catchall', () => {
    const route = createRoute({
      name: 'path-with-params',
      path: 'parent/child/[childParam]/grand-child/[grandChild123]',
      component,
    })

    const result = generateRoutePathRegexPattern(route)

    const catchAll = '.+'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with optional params, returns value with params replaced with catchall', () => {
    const route = createRoute({
      name: 'path-with-optional-params',
      path: 'parent/child/[?childParam]/grand-child/[?grandChild123]',
      component,
    })

    const result = generateRoutePathRegexPattern(route)

    const catchAll = '.*'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with regex characters outside of params, escapes regex characters', () => {
    const route = createRoute({
      name: 'path-with-regex-chars',
      path: 'path.with$]regex[params*',
      component,
    })

    const result = generateRoutePathRegexPattern(route)

    const expected = new RegExp('^path\\.with\\$\\]regex\\[params\\*$', 'i')
    expect(result.toString()).toBe(expected.toString())
  })
})

describe('generateRouteQueryRegexPatterns', () => {
  test('given query without params, returns unmodified value with start and end markers', () => {
    const route = createRoute({
      name: 'query-without-params',
      path: 'query',
      component,
    })

    const result = generateRouteQueryRegexPatterns(route)

    expect(result).toMatchObject([])
  })

  test('given query with required params, returns value with params replaced with catchall', () => {
    const route = createRoute({
      name: 'query-with-params',
      path: 'query',
      query: 'dynamic=[first]&static=params&another=[second]',
      component,
    })

    const result = generateRouteQueryRegexPatterns(route)

    const catchAll = '([^/]+)'
    expect(result).toMatchObject([new RegExp(`dynamic=${catchAll}`), new RegExp('static=params'), new RegExp(`dynamic=${catchAll}`)])
  })

  test('given query with optional params, returns value without params', () => {
    const route = createRoute({
      name: 'query-with-optional-params',
      path: 'query',
      query: 'dynamic=[?first]&static=params&another=[?second]',
      component,
    })

    const result = generateRouteQueryRegexPatterns(route)

    expect(result).toMatchObject([new RegExp('static=params')])
  })

  test('given query with regex characters outside of params, escapes regex characters', () => {
    const route = createRoute({
      name: 'query-with-regex-chars',
      path: 'query',
      query: 'query=$with&normal=[param]&regex*chars=)throughout[&',
      component,
    })

    const result = generateRouteQueryRegexPatterns(route)

    expect(result.map(pattern => pattern.toString())).toMatchObject([
      '/query=\\$with(&|$)/i',
      '/normal=.+(&|$)/i',
      '/regex\\*chars=\\)throughout\\[(&|$)/i',
    ])
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

describe('splitByMatches', () => {
  test('given string without matches, returns full string', () => {
    const value = 'string without matches'
    const pattern = /will-not-find/g

    const response = splitByMatches(value, pattern)

    expect(response).toMatchObject([value])
  })

  test('given string with match at the beginning, returns match the rest', () => {
    const value = 'at-beginning, string with match'
    const pattern = /at-beginning/g

    const response = splitByMatches(value, pattern)

    expect(response).toMatchObject(['at-beginning', ', string with match'])
  })

  test('given string with match at the end, returns the rest then match', () => {
    const value = 'string with match at-end'
    const pattern = /at-end/g

    const response = splitByMatches(value, pattern)

    expect(response).toMatchObject(['string with match ', 'at-end'])
  })

  test('given string with matches in the middle, returns array of matches and everything in between', () => {
    const value = 'found-throughout string found-throughout with match found-throughout'
    const pattern = /found-throughout/g

    const response = splitByMatches(value, pattern)

    expect(response).toMatchObject(['found-throughout', ' string ', 'found-throughout', ' with match ', 'found-throughout'])
  })
})
