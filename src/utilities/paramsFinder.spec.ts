import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/types'
import { getParamValuesFromUrl, optional, setParamValuesOnUrl } from '@/utilities'

describe('getParamValuesFromUrl', () => {
  test('given path WITHOUT params, always returns empty array', () => {
    const response = getParamValuesFromUrl('/no-params', '/no-params', 'key')

    expect(response).toHaveLength(0)
  })

  test('given paramName that does NOT match param on route, always returns empty array', () => {
    const response = getParamValuesFromUrl('/key/ABC/not-in/123', '/key/:key/not-in/:route', 'fail')

    expect(response).toHaveLength(0)
  })

  test('given paramName that matches param on route but value is not present, always returns empty array', () => {
    const response = getParamValuesFromUrl('/simple', '/simple/:simple', 'simple')

    expect(response).toHaveLength(0)
  })

  test('given paramName that matches param on route and value is not present, returns single value in array', () => {
    const response = getParamValuesFromUrl('/simple/ABC', '/simple/:simple', 'simple')

    expect(response).toMatchObject(['ABC'])
  })

  test('given paramName that matches multiple param on route and value is present, returns each value in array', () => {
    const response = getParamValuesFromUrl('/simple/ABC/DEF/gap/GHI', '/simple/:simple/:simple/gap/:simple', 'simple')

    expect(response).toMatchObject(['ABC', 'DEF', 'GHI'])
  })

  test('given paramName that matches multiple param on route value is present with some optional, returns each value in array including empty string', () => {
    const response = getParamValuesFromUrl('/simple/ABC//gap/GHI', '/simple/:simple/:?simple/gap/:simple', 'simple')

    expect(response).toMatchObject(['ABC', '', 'GHI'])
  })

  test('given multiple params, uses wildcards for non-selected param name', () => {
    const response = getParamValuesFromUrl('/ABC/123/true', '/:str/:num/:bool', 'num')

    expect(response).toMatchObject(['123'])
  })
})

describe('setParamValuesOnUrl', () => {
  test('given path WITHOUT params, always returns url as it was passed', () => {
    const response = setParamValuesOnUrl('/no-params')

    expect(response).toBe('/no-params')
  })

  test('given paramName that does NOT match param on route, always returns empty array', () => {
    const response = setParamValuesOnUrl('/key/:key/not-in/:route', { name: 'fail', params: [String], values: ['ABC'] })

    expect(response).toBe('/key/:key/not-in/:route')
  })

  test('given paramName that matches param on route but value is not present, always returns empty array', () => {
    const response = setParamValuesOnUrl('/simple/:simple', { name: 'simple', params: [String], values: ['ABC'] })

    expect(response).toBe('/simple/ABC')
  })

  test('given paramName that matches param on route and value is not present, returns single value in array', () => {
    expect(() => setParamValuesOnUrl('/simple/:simple', { name: 'simple', params: [String], values: [] })).toThrowError(InvalidRouteParamValueError)
  })

  test('given paramName that matches multiple param on route and value is present, returns each value in array', () => {
    const response = setParamValuesOnUrl('/simple/:simple/:simple/gap/:simple', { name: 'simple', params: [String, String, String], values: ['ABC', 'DEF', 'GHI'] })

    expect(response).toBe('/simple/ABC/DEF/gap/GHI')
  })

  test('given paramName that matches multiple param on route value is present with some optional, returns each value in array including empty string', () => {
    const response = setParamValuesOnUrl('/simple/:simple/:?simple/gap/:simple', { name: 'simple', params: [String, optional(String), String], values: ['ABC', undefined, 'GHI'] })

    expect(response).toBe('/simple/ABC//gap/GHI')
  })
})