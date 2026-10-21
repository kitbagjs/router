import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createParamPatterns } from '@/services/paramsFinder'
import { withParams } from '@/services/withParams'

describe('parseValue', () => {
  test('given path WITHOUT params, always returns undefined', () => {
    const path = withParams('/no-params', {})
    const response = createParamPatterns(path).parseValue('/no-params', 'key')

    expect(response).toBe(undefined)
  })

  test('given paramName that does NOT match param on route, always returns undefined', () => {
    const path = withParams('/key/[key]/not-in/[route]', {})
    const response = createParamPatterns(path).parseValue('/key/ABC/not-in/123', 'fail')

    expect(response).toBe(undefined)
  })

  test('given paramName that matches param on route but value is not present, always returns undefined', () => {
    const path = withParams('/simple/[simple]', {})
    const response = createParamPatterns(path).parseValue('/simple', 'simple')

    expect(response).toBe(undefined)
  })

  test('given paramName that matches param on route, returns value', () => {
    const path = withParams('/simple/[simple]', {})
    const response = createParamPatterns(path).parseValue('/simple/ABC', 'simple')

    expect(response).toBe('ABC')
  })

  test('given multiple params, uses wildcards for non-selected param name', () => {
    const path = withParams('/[str]/[num]/[bool]', {})
    const response = createParamPatterns(path).parseValue('/ABC/123/true', 'num')

    expect(response).toBe('123')
  })

  test('given multiple params, where optional params are omitted from path, still finds the required param', () => {
    const path = withParams('/[required]/[?optional]', {})
    const response = createParamPatterns(path).parseValue('/ABC/', 'required')

    expect(response).toBe('ABC')
  })

  test('given regex characters outside of params, matches them literally', () => {
    const before = withParams('/report(1)/[id]', {})
    const after = withParams('/[id]/report(1)', {})

    expect(createParamPatterns(before).parseValue('/report(1)/123', 'id')).toBe('123')
    expect(createParamPatterns(after).parseValue('/123/report(1)', 'id')).toBe('123')
    expect(createParamPatterns(before).parseValue('/report1/123', 'id')).toBe(undefined)
  })

  test('given path with greedy param, extracts multi-segment value for greedy param', () => {
    const path = withParams('/[id]/[rest*]/suffix', {})

    expect(createParamPatterns(path).parseValue('/1/a/b/c/suffix', 'rest')).toBe('a/b/c')
    expect(createParamPatterns(path).parseValue('/1/a/b/c/suffix', 'id')).toBe('1')
  })
})

describe('stringifyValue', () => {
  test('given path WITHOUT params, always returns url as it was passed', () => {
    const path = withParams('/no-params', {})
    const response = createParamPatterns(path).stringifyValue('/no-params', 'key', 'ABC')

    expect(response).toBe('/no-params')
  })

  test('given paramName that does NOT match param on route, returns url unmodified', () => {
    const path = withParams('/key/[key]/not-in/[route]', {})
    const response = createParamPatterns(path).stringifyValue('/key/[key]/not-in/[route]', 'fail', 'ABC')

    expect(response).toBe('/key/[key]/not-in/[route]')
  })

  test('given paramName that matches param on route, returns url with param replaced', () => {
    const path = withParams('/simple/[simple]', {})
    const response = createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', 'ABC')

    expect(response).toBe('/simple/ABC')
  })

  test('given value with a percent sign or brackets, encodes them', () => {
    const path = withParams('/simple/[simple]', {})

    expect(createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', '100%')).toBe('/simple/100%25')
    expect(createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', '[other]')).toBe('/simple/%5Bother%5D')
  })

  test('given value with replacement patterns, inserts it literally', () => {
    const path = withParams('/simple/[simple]', {})

    expect(createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', '$&')).toBe('/simple/$&')
    expect(createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', '$$')).toBe('/simple/$$')
    expect(createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', "a$'b")).toBe("/simple/a$'b")
  })

  test('given paramName that matches param on route and value is not present, throws InvalidRouteParamValueError', () => {
    const path = withParams('/simple/[simple]', {})
    const action: () => void = () => createParamPatterns(path).stringifyValue('/simple/[simple]', 'simple', undefined)

    expect(action).toThrow(InvalidRouteParamValueError)
  })
})
