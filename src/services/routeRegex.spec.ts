import { describe, expect, test } from 'vitest'
import { generateRouteHostRegexPattern, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns, getParamName, paramIsGreedy, regexCaptureAll, regexCatchAll, regexGreedyCatchAll, regexGreedyCaptureAll, replaceIndividualParamWithCaptureGroup, splitByMatches } from '@/services/routeRegex'

describe('generateRouteHostRegexPattern', () => {
  test('given host without params, returns unmodified value with start and end markers', () => {
    const host = 'https://www.kitbag.io'

    const result = generateRouteHostRegexPattern(host)

    const expected = new RegExp('^https://www\\.kitbag\\.io$', 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given host with params, returns value with params replaced with catchall', () => {
    const host = 'https://[subdomain].kitbag.io'

    const result = generateRouteHostRegexPattern(host)

    const expected = new RegExp(`^https://${regexCatchAll}\\.kitbag\\.io$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given host with optional params, returns value with params replaced with catchall', () => {
    const host = 'https://[?subdomain].kitbag.io'

    const result = generateRouteHostRegexPattern(host)

    const expected = new RegExp(`^https://${regexCatchAll}\\.kitbag\\.io$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given host with regex characters outside of params, escapes regex characters', () => {
    const host = 'https://www.with$]regex[params*'

    const result = generateRouteHostRegexPattern(host)

    const expected = new RegExp('^https://www\\.with\\$\\]regex\\[params\\*$', 'i')
    expect(result.toString()).toBe(expected.toString())
  })
})

describe('generateRoutePathRegexPattern', () => {
  test('given path without params, returns unmodified value with start and end markers', () => {
    const path = 'parent/child/grandchild'

    const result = generateRoutePathRegexPattern(path)

    const expected = new RegExp('^parent/child/grandchild$', 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with params, returns value with params replaced with catchall', () => {
    const path = 'parent/child/[childParam]/grand-child/[grandChild123]'

    const result = generateRoutePathRegexPattern(path)

    const expected = new RegExp(`^parent/child/${regexCatchAll}/grand-child/${regexCatchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with optional params, returns value with params replaced with catchall', () => {
    const path = 'parent/child/[?childParam]/grand-child/[?grandChild123]'

    const result = generateRoutePathRegexPattern(path)

    const expected = new RegExp(`^parent/child/${regexCatchAll}/grand-child/${regexCatchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with regex characters outside of params, escapes regex characters', () => {
    const path = 'path.with$]regex[params*'

    const result = generateRoutePathRegexPattern(path)

    const expected = new RegExp('^path\\.with\\$\\]regex\\[params\\*$', 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with greedy param, uses greedy catch-all for that segment', () => {
    const path = 'parent/[a]/[b*]/[c]'

    const result = generateRoutePathRegexPattern(path)

    const expected = new RegExp(`^parent/${regexCatchAll}/${regexGreedyCatchAll}/${regexCatchAll}$`, 'i')
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with trailing slash, returns pattern with optional trailing slash', () => {
    const path = 'parent/child/'

    const result = generateRoutePathRegexPattern(path)

    const expected = new RegExp('^parent/child\\/?$', 'i')
    expect(result.toString()).toBe(expected.toString())
  })
})

describe('generateRouteQueryRegexPatterns', () => {
  test('given query without params, returns unmodified value with start and end markers', () => {
    const result = generateRouteQueryRegexPatterns('')

    expect(result).toMatchObject([])
  })

  test('given query with required params, returns value with params replaced with catchall', () => {
    const query = 'dynamic=[first]&static=params&another=[second]'

    const result = generateRouteQueryRegexPatterns(query)

    expect(result).toMatchObject([new RegExp(`dynamic=${regexCaptureAll}`), new RegExp('static=params'), new RegExp(`another=${regexCaptureAll}`)])
  })

  test('given query with optional params, returns value without params', () => {
    const query = 'dynamic=[?first]&static=params&another=[?second]'

    const result = generateRouteQueryRegexPatterns(query)

    expect(result).toMatchObject([new RegExp('static=params')])
  })

  test('given query with regex characters outside of params, escapes regex characters', () => {
    const query = 'query=$with&normal=[param]&regex*chars=)throughout[&'

    const result = generateRouteQueryRegexPatterns(query)

    expect(result.map((pattern) => pattern.toString())).toMatchObject([
      '/query=\\$with(&|$)/i',
      `/normal=${regexCatchAll}(&|$)/i`,
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

  test('given string with greedy param name syntax, returns base param name', () => {
    const response = getParamName('[foo*]')

    expect(response).toBe('foo')
  })

  test('given string with optional greedy param name syntax, returns base param name', () => {
    const response = getParamName('[?foo*]')

    expect(response).toBe('foo')
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

describe('paramIsGreedy', () => {
  test('given path with greedy param syntax, returns true for that param', () => {
    const path = '/foo/[bar*]/baz'

    expect(paramIsGreedy(path, 'bar')).toBe(true)
  })

  test('given path with optional greedy param syntax, returns true for that param', () => {
    const path = '/foo/[?bar*]/baz'

    expect(paramIsGreedy(path, 'bar')).toBe(true)
  })

  test('given path with normal param syntax, returns false for that param', () => {
    const path = '/foo/[bar]/baz'

    expect(paramIsGreedy(path, 'bar')).toBe(false)
  })

  test('given path with optional param syntax, returns false for that param', () => {
    const path = '/foo/[?bar]/baz'

    expect(paramIsGreedy(path, 'bar')).toBe(false)
  })
})

describe('replaceIndividualParamWithCaptureGroup', () => {
  test('given normal param, replaces with segment capture pattern', () => {
    const path = '/[id]/suffix'

    const result = replaceIndividualParamWithCaptureGroup(path, 'id')

    expect(result).toBe(`/${regexCaptureAll}/suffix`)
  })

  test('given greedy param, replaces with greedy capture pattern', () => {
    const path = '/[rest*]/suffix'

    const result = replaceIndividualParamWithCaptureGroup(path, 'rest')

    expect(result).toBe(`/${regexGreedyCaptureAll}/suffix`)
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
