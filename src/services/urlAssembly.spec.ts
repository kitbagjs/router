import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createRoutes } from '@/services/createRoutes'
import { withDefault } from '@/services/params'
import { path } from '@/services/path'
import { query } from '@/services/query'
import { assembleUrl } from '@/services/urlAssembly'
import { component } from '@/utilities/testHelpers'

describe('path params', () => {
  test.each([
    ['/simple'],
    [path('/simple', {})],
  ])('given simple route with string path and without params, returns route path', (path) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path,
        component,
      },
    ])

    const url = assembleUrl(route)

    expect(url).toBe('/simple')
  })

  test.each([
    ['/simple/[?simple]'],
    [path('/simple/[?simple]', { simple: String })],
  ])('given route with optional string param NOT provided, returns route Path with string without values interpolated', (path) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path,
        component,
      },
    ])

    const url = assembleUrl(route)

    expect(url).toBe('/simple/')
  })

  test('given route with default string param NOT provided, returns route Path with string with default value interpolated', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: path('/simple/[simple]', { simple: withDefault(String, 'abc') }),
        component,
      },
    ])

    const url = assembleUrl(route)

    expect(url).toBe('/simple/abc')
  })

  test.each([
    ['/simple/[?simple]'],
    [path('/simple/[?simple]', { simple: String })],
  ])('given route with optional string param provided, returns route Path with string with values interpolated', (path) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path,
        component,
      },
    ])

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/simple/ABC')
  })

  test('given route with default string param provided, returns route Path with string with values interpolated', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: path('/simple/[simple]', { simple: withDefault(String, 'abc') }),
        component,
      },
    ])

    const url = assembleUrl(route, {
      params: { simple: 'DEF' },
    })

    expect(url).toBe('/simple/DEF')
  })

  test.each([
    ['/simple/[simple]'],
    [path('/simple/[simple]', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (path) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path,
        component,
      },
    ])

    expect(() => assembleUrl(route, {})).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['/simple/[simple]'],
    [path('/simple/[simple]', { simple: String })],
  ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path,
        component,
      },
    ])

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/simple/ABC')
  })
})

describe('query params', () => {
  test.each([
    ['simple=abc'],
    [query('simple=abc', {})],
  ])('given simple route with string query and without params, returns route query', (query) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query,
        component,
      },
    ])

    const url = assembleUrl(route)

    expect(url).toBe('/?simple=abc')
  })

  test.each([
    ['simple=[?simple]'],
    [query('simple=[?simple]', { simple: String })],
  ])('given route with optional param NOT provided, leaves entire key off', (query) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query,
        component,
      },
    ])

    const url = assembleUrl(route)

    expect(url).toBe('/')
  })

  test('given route with default param NOT provided, adds key with default value', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query: query('simple=[simple]', { simple: withDefault(String, 'abc') }),
        component,
      },
    ])

    const url = assembleUrl(route)

    expect(url).toBe('/?simple=abc')
  })

  test.each([
    ['simple=[?simple]'],
    [query('simple=[?simple]', { simple: String })],
  ])('given route with optional string param provided but empty, returns route Query with string without values interpolated', (query) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query,
        component,
      },
    ])

    const url = assembleUrl(route, { params: { simple: '' } })

    expect(url).toBe('/?simple=')
  })


  test('given route with default string param provided but empty, returns route Query with string without values interpolated', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query: query('simple=[simple]', { simple: withDefault(String, 'abc') }),
        component,
      },
    ])

    const url = assembleUrl(route, { params: { simple: '' } })

    expect(url).toBe('/?simple=')
  })

  test.each([
    ['simple=[?simple]'],
    [query('simple=[?simple]', { simple: String })],
  ])('given route with optional string param provided, returns route Query with string with values interpolated', (query) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query,
        component,
      },
    ])

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })


  test('given route with default string param provided, returns route Query with string with values interpolated', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query: query('simple=[simple]', { simple: withDefault(String, 'abc') }),
        component,
      },
    ])

    const url = assembleUrl(route, {
      params: { simple: 'DEF' },
    })

    expect(url).toBe('/?simple=DEF')
  })

  test.each([
    ['simple=[simple]'],
    [query('simple=[simple]', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (query) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query,
        component,
      },
    ])

    expect(() => assembleUrl(route)).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['simple=[simple]'],
    [query('simple=[simple]', { simple: String })],
  ])('given route with required string param provided, returns route Query with string with values interpolated', (query) => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query,
        component,
      },
    ])

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })
})

describe('static query', () => {
  test('given a static query returns route with query values added', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        component,
      },
    ])

    const url = assembleUrl(route, {
      query: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })

  test('given a route with a query and a static query returns route with query values added', () => {
    const [route] = createRoutes([
      {
        name: 'simple',
        path: '/',
        query: 'foo=foo',
        component,
      },
    ])

    const url = assembleUrl(route, {
      query: { simple: 'ABC' },
    })

    expect(url).toBe('/?foo=foo&simple=ABC')
  })
})