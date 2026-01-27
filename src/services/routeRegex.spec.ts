import { describe, expect, test } from 'vitest'
import { generateQueryRegexPatterns, getParamName, regexCaptureAll, regexCatchAll, replaceParamSyntaxWithCatchAllsAndEscapeRest, splitByMatches } from '@/services/routeRegex'

describe('replaceParamSyntaxWithCatchAllsAndEscapeRest', () => {
  test('given host without params, returns unmodified value with start and end markers', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('www.kitbag.io')

    const expected = new RegExp('^www\\.kitbag\\.io$', 'i')
    expect(result).toBe(expected.toString())
  })

  test('given host with params, returns value with params replaced with catchall', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('[subdomain].kitbag.io')

    const expected = new RegExp(`^${regexCatchAll}\\.kitbag\\.io$`, 'i')
    expect(result).toBe(expected.toString())
  })

  test('given host with optional params, returns value with params replaced with catchall', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('[?subdomain].kitbag.io')

    const expected = new RegExp(`^${regexCatchAll}\\.kitbag\\.io$`, 'i')
    expect(result).toBe(expected.toString())
  })

  test('given host with regex characters outside of params, escapes regex characters', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('www.with$]regex[params*')

    const expected = new RegExp('^www\\.with\\$\\]regex\\[params\\*$', 'i')
    expect(result).toBe(expected.toString())
  })

  test('given path without params, returns unmodified value with start and end markers', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('parent/child/grandchild')

    const expected = new RegExp('^parent/child/grandchild$', 'i')
    expect(result).toBe(expected.toString())
  })

  test('given path with params, returns value with params replaced with catchall', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('parent/child/[childParam]/grand-child/[grandChild123]')

    const expected = new RegExp(`^parent/child/${regexCatchAll}/grand-child/${regexCatchAll}$`, 'i')
    expect(result).toBe(expected.toString())
  })

  test('given path with optional params, returns value with params replaced with catchall', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('parent/child/[?childParam]/grand-child/[?grandChild123]')

    const expected = new RegExp(`^parent/child/${regexCatchAll}/grand-child/${regexCatchAll}$`, 'i')
    expect(result).toBe(expected.toString())
  })

  test('given path with regex characters outside of params, escapes regex characters', () => {
    const result = replaceParamSyntaxWithCatchAllsAndEscapeRest('path.with$]regex[params*')

    const expected = new RegExp('^path\\.with\\$\\]regex\\[params\\*$', 'i')
    expect(result).toBe(expected.toString())
  })
})

describe('generateRouteQueryRegexPatterns', () => {
  test('given query with required params, returns value with params replaced with catchall', () => {
    const result = generateQueryRegexPatterns('dynamic=[first]&static=params&another=[second]')

    expect(result).toMatchObject([new RegExp(`dynamic=${regexCaptureAll}`), new RegExp('static=params'), new RegExp(`another=${regexCaptureAll}`)])
  })

  test('given query with optional params, returns value without params', () => {
    const result = generateQueryRegexPatterns('dynamic=[?first]&static=params&another=[?second]')

    expect(result).toMatchObject([new RegExp('static=params')])
  })

  test('given query with regex characters outside of params, escapes regex characters', () => {
    const result = generateQueryRegexPatterns('query=$with&normal=[param]&regex*chars=)throughout[&')

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
