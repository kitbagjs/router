import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { getParamValueFromUrl, setParamValueOnUrl } from '@/services/paramsFinder'

describe('getParamValueFromUrl', () => {
  test('given path WITHOUT params, always returns undefined', () => {
    const response = getParamValueFromUrl('/no-params', '/no-params', 'key')

    expect(response).toBe(undefined)
  })

  test('given paramName that does NOT match param on route, always returns undefined', () => {
    const response = getParamValueFromUrl('/key/ABC/not-in/123', '/key/[key]/not-in/[route]', 'fail')

    expect(response).toBe(undefined)
  })

  test('given paramName that matches param on route but value is not present, always returns undefined', () => {
    const response = getParamValueFromUrl('/simple', '/simple/[simple]', 'simple')

    expect(response).toBe(undefined)
  })

  test('given paramName that matches param on route, returns value', () => {
    const response = getParamValueFromUrl('/simple/ABC', '/simple/[simple]', 'simple')

    expect(response).toMatchObject('ABC')
  })

  test('given multiple params, uses wildcards for non-selected param name', () => {
    const response = getParamValueFromUrl('/ABC/123/true', '/[str]/[num]/[bool]', 'num')

    expect(response).toMatchObject('123')
  })
})

describe('setParamValueOnUrl', () => {
  test('given path WITHOUT params, always returns url as it was passed', () => {
    const response = setParamValueOnUrl('/no-params')

    expect(response).toBe('/no-params')
  })

  test('given paramName that does NOT match param on route, returns url unmodified', () => {
    const response = setParamValueOnUrl('/key/[key]/not-in/[route]', { name: 'fail', param: String, value: 'ABC' })

    expect(response).toBe('/key/[key]/not-in/[route]')
  })

  test('given paramName that matches param on route, returns url with param replaced', () => {
    const response = setParamValueOnUrl('/simple/[simple]', { name: 'simple', param: String, value: 'ABC' })

    expect(response).toBe('/simple/ABC')
  })

  test('given paramName that matches param on route and value is not present, throws InvalidRouteParamValueError', () => {
    const action: () => void = () => setParamValueOnUrl('/simple/[simple]', { name: 'simple', param: String, value: undefined })

    expect(action).toThrowError(InvalidRouteParamValueError)
  })
})