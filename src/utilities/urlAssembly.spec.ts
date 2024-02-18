import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError, Route } from '@/types'
import { path, query, resolveRoutes } from '@/utilities'
import { component } from '@/utilities/testHelpers'
import { assembleUrl } from '@/utilities/urlAssembly'

describe('path params', () => {
  test.each([
    ['/simple'],
    [path('/simple', {})],
  ])('given simple route with string path and without params, returns route path', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved)

    expect(url).toBe('/simple')
  })

  test.each([
    ['/simple/:?simple'],
    [path('/simple/:?simple', { simple: String })],
  ])('given route with optional string param NOT provided, returns route Path with string without values interpolated', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved)

    expect(url).toBe('/simple/')
  })

  test.each([
    ['/simple/:?simple'],
    [path('/simple/:?simple', { simple: String })],
  ])('given route with optional string param provided, returns route Path with string with values interpolated', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {
      params: { simple: ['ABC'] },
    })

    expect(url).toBe('/simple/ABC')
  })

  test.each([
    ['/simple/:simple'],
    [path('/simple/:simple', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    expect(() => assembleUrl(resolved, {})).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['/simple/:simple'],
    [path('/simple/:simple', { simple: String })],
  ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {
      params: { simple: ['ABC'] },
    })

    expect(url).toBe('/simple/ABC')
  })
})

describe('query params', () => {
  test.each([
    ['simple=abc'],
    [query('simple=abc', {})],
  ])('given simple route with string query and without params, returns route query', (query) => {
    const route = {
      name: 'simple',
      path: '/',
      query,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved)

    expect(url).toBe('/?simple=abc')
  })

  test.each([
    ['simple=:?simple'],
    [query('simple=:?simple', { simple: String })],
  ])('given route with optional string param NOT provided, returns route Query with string without values interpolated', (query) => {
    const route = {
      name: 'simple',
      path: '/',
      query,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved)

    expect(url).toBe('/?simple=')
  })

  test.each([
    ['simple=:?simple'],
    [query('simple=:?simple', { simple: String })],
  ])('given route with optional string param provided, returns route Query with string with values interpolated', (query) => {
    const route = {
      name: 'simple',
      path: '/',
      query,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {
      params: { simple: ['ABC'] },
    })

    expect(url).toBe('/?simple=ABC')
  })

  test.each([
    ['simple=:simple'],
    [query('simple=:simple', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (query) => {
    const route = {
      name: 'simple',
      path: '/',
      query,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    expect(() => assembleUrl(resolved)).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['simple=:simple'],
    [query('simple=:simple', { simple: String })],
  ])('given route with required string param provided, returns route Query with string with values interpolated', (query) => {
    const route = {
      name: 'simple',
      path: '/',
      query,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {
      params: { simple: ['ABC'] },
    })

    expect(url).toBe('/?simple=ABC')
  })
})

describe('queries', () => {
  test('given a static query returns route with query values added', () => {
    const route = {
      name: 'simple',
      path: '/',
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {
      query: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })

  test('given a route with a query and a static query returns route with query values added', () => {
    const route = {
      name: 'simple',
      path: '/',
      query: 'foo=foo',
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {
      query: { simple: 'ABC' },
    })

    expect(url).toBe('/?foo=foo&simple=ABC')
  })
})