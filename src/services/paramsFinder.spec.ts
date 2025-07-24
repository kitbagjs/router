import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { getParamValueFromUrl, setParamValueOnUrl } from '@/services/paramsFinder'
import { withParams } from '@/services/withParams'

describe('getParamValueFromUrl', () => {
  test('given path WITHOUT params, always returns undefined', () => {
    const path = withParams('/no-params', {})
    const response = getParamValueFromUrl('/no-params', path, 'key')

    expect(response).toBe(undefined)
  })

  test('given paramName that does NOT match param on route, always returns undefined', () => {
    const path = withParams('/key/[key]/not-in/[route]', {})
    const response = getParamValueFromUrl('/key/ABC/not-in/123', path, 'fail')

    expect(response).toBe(undefined)
  })

  test('given paramName that matches param on route but value is not present, always returns undefined', () => {
    const path = withParams('/simple/[simple]', {})
    const response = getParamValueFromUrl('/simple', path, 'simple')

    expect(response).toBe(undefined)
  })

  test('given paramName that matches param on route, returns value', () => {
    const path = withParams('/simple/[simple]', {})
    const response = getParamValueFromUrl('/simple/ABC', path, 'simple')

    expect(response).toBe('ABC')
  })

  test('given multiple params, uses wildcards for non-selected param name', () => {
    const path = withParams('/[str]/[num]/[bool]', {})
    const response = getParamValueFromUrl('/ABC/123/true', path, 'num')

    expect(response).toBe('123')
  })

  test('given multiple params, where optional params are omitted from path, still finds the required param', () => {
    const path = withParams('/[required]/[?optional]', {})
    const response = getParamValueFromUrl('/ABC/', path, 'required')

    expect(response).toBe('ABC')
  })
})

describe('setParamValueOnUrl', () => {
  test('given path WITHOUT params, always returns url as it was passed', () => {
    const path = withParams('/no-params', {})
    const response = setParamValueOnUrl('/no-params', path, 'key', 'ABC')

    expect(response).toBe('/no-params')
  })

  test('given paramName that does NOT match param on route, returns url unmodified', () => {
    const path = withParams('/key/[key]/not-in/[route]', {})
    const response = setParamValueOnUrl('/key/[key]/not-in/[route]', path, 'fail', 'ABC')

    expect(response).toBe('/key/[key]/not-in/[route]')
  })

  test('given paramName that matches param on route, returns url with param replaced', () => {
    const path = withParams('/simple/[simple]', {})
    const response = setParamValueOnUrl('/simple/[simple]', path, 'simple', 'ABC')

    expect(response).toBe('/simple/ABC')
  })

  test('given paramName that matches param on route and value is not present, throws InvalidRouteParamValueError', () => {
    const path = withParams('/simple/[simple]', {})
    const action: () => void = () => setParamValueOnUrl('/simple/[simple]', path, 'simple', undefined)

    expect(action).toThrowError(InvalidRouteParamValueError)
  })
})
