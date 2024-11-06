import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRoute } from '@/services/createRoute'
import { host } from '@/services/host'
import { path } from '@/services/path'
import { query } from '@/services/query'
import { assembleUrl } from '@/services/urlAssembly'
import { withDefault } from '@/services/withDefault'
import { component } from '@/utilities/testHelpers'

describe('path params', () => {
  test.each([
    ['/simple'],
    [path('/simple', {})],
  ])('given simple route with string path and without params, returns route path', (path) => {
    const route = createRoute({
      name: 'simple',
      path,
      component,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/simple')
  })

  test.each([
    ['/simple/[?simple]'],
    [path('/simple/[?simple]', { simple: String })],
    [path('/simple/[?simple]', { simple: withDefault(String, 'abc') })],
  ])('given route with optional string param NOT provided, returns route Path with string without values interpolated', (path) => {
    const route = createRoute({
      name: 'simple',
      path,
      component,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/simple/')
  })

  test.each([
    ['/simple/[?simple]'],
    [path('/simple/[?simple]', { simple: String })],
  ])('given route with optional string param provided, returns route Path with string with values interpolated', (path) => {
    const route = createRoute({
      name: 'simple',
      path,
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/simple/ABC')
  })

  test('given route with default string param provided, returns route Path with string with values interpolated', () => {
    const route = createRoute({
      name: 'simple',
      path: path('/simple/[simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'DEF' },
    })

    expect(url).toBe('/simple/DEF')
  })

  test.each([
    ['/simple/[simple]'],
    [path('/simple/[simple]', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (path) => {
    const route = createRoute({
      name: 'simple',
      path,
      component,
    })

    expect(() => assembleUrl(route, {})).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['/simple/[simple]'],
    [path('/simple/[simple]', { simple: String })],
  ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
    const route = createRoute({
      name: 'simple',
      path,
      component,
    })

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
    const route = createRoute({
      name: 'simple',
      path: '/',
      query,
      component,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/?simple=abc')
  })

  test.each([
    ['simple=[?simple]'],
    [query('simple=[?simple]', { simple: String })],
    [query('simple=[?simple]', { simple: withDefault(String, 'abc') })],
  ])('given route with optional param NOT provided, leaves entire key off', (query) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query,
      component,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/')
  })

  test.each([
    ['simple=[?simple]'],
    [query('simple=[?simple]', { simple: String })],
  ])('given route with optional string param provided but empty, returns route Query with string without values interpolated', (query) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query,
      component,
    })

    const url = assembleUrl(route, { params: { simple: '' } })

    expect(url).toBe('/?simple=')
  })

  test('given route with default string param provided but empty, returns route Query with string without values interpolated', () => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query: query('simple=[simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const url = assembleUrl(route, { params: { simple: '' } })

    expect(url).toBe('/?simple=')
  })

  test.each([
    ['simple=[?simple]'],
    [query('simple=[?simple]', { simple: String })],
  ])('given route with optional string param provided, returns route Query with string with values interpolated', (query) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query,
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })

  test('given route with default string param provided, returns route Query with string with values interpolated', () => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query: query('simple=[simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'DEF' },
    })

    expect(url).toBe('/?simple=DEF')
  })

  test.each([
    ['simple=[simple]'],
    [query('simple=[simple]', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (query) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query,
      component,
    })

    expect(() => assembleUrl(route)).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['simple=[simple]'],
    [query('simple=[simple]', { simple: String })],
  ])('given route with required string param provided, returns route Query with string with values interpolated', (query) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query,
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })
})

describe('static query', () => {
  test('given a static query returns route with query values added', () => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      component,
    })

    const url = assembleUrl(route, {
      query: { simple: 'ABC' },
    })

    expect(url).toBe('/?simple=ABC')
  })

  test('given a route with a query and a static query returns route with query values added', () => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      query: 'foo=foo',
      component,
    })

    const url = assembleUrl(route, {
      query: { simple: 'ABC' },
    })

    expect(url).toBe('/?foo=foo&simple=ABC')
  })
})

describe('host params', () => {
  test.each([
    ['kitbag.dev'],
    [host('kitbag.dev', {})],
  ])('given simple route with string host and without params, returns route host', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route)

    expect(url).toBe('kitbag.dev/')
  })

  test.each([
    ['[?subdomain]kitbag.dev'],
    [host('[?subdomain]kitbag.dev', { subdomain: String })],
    [host('[?subdomain]kitbag.dev', { subdomain: withDefault(String, 'abc') })],
  ])('given route with optional param NOT provided, leaves entire key off', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route)

    expect(url).toBe('kitbag.dev/')
  })

  test.each([
    ['[?subdomain]kitbag.dev'],
    [host('[?subdomain]kitbag.dev', { subdomain: String })],
  ])('given route with optional string param provided, returns route Host with string with values interpolated', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route, {
      params: { subdomain: 'ABC.' },
    })

    expect(url).toBe('ABC.kitbag.dev/')
  })

  test('given route with default string param provided, returns route Host with string with values interpolated', () => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host: host('[?subdomain]kitbag.dev', { subdomain: withDefault(String, 'abc.') }),
    })

    const url = assembleUrl(route, {
      params: { subdomain: 'DEF.' },
    })

    expect(url).toBe('DEF.kitbag.dev/')
  })

  test.each([
    ['[subdomain]kitbag.dev'],
    [host('[subdomain]kitbag.dev', { subdomain: String })],
  ])('given route with required string param NOT provided, throws error', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    expect(() => assembleUrl(route)).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['[subdomain]kitbag.dev'],
    [host('[subdomain]kitbag.dev', { subdomain: String })],
  ])('given route with required string param provided, returns route Host with string with values interpolated', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route, {
      params: { subdomain: 'ABC.' },
    })

    expect(url).toBe('ABC.kitbag.dev/')
  })
})

test('given route with hash, returns url with hash value interpolated', () => {
  const route = createRoute({
    name: 'simple',
    path: '/',
  })

  const url = assembleUrl(route, { hash: 'foo' })

  expect(url).toBe('/#foo')
})
