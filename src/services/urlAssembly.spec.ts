import { describe, expect, test, vi } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRoute } from '@/services/createRoute'
import { assembleUrl } from '@/services/urlAssembly'
import { withDefault } from '@/services/withDefault'
import { component } from '@/utilities/testHelpers'
import { createParam } from '@/services/createParam'
import { withParams } from '@/services/withParams'

describe('path params', () => {
  test.each([
    ['/simple'],
    [withParams('/simple', {})],
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
    [withParams('/simple/[?simple]', { simple: String })],
    [withParams('/simple/[?simple]', { simple: withDefault(String, 'abc') })],
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
    [withParams('/simple/[?simple]', { simple: String })],
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
      path: withParams('/simple/[simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'DEF' },
    })

    expect(url).toBe('/simple/DEF')
  })

  test.each([
    ['/simple/[simple]'],
    [withParams('/simple/[simple]', { simple: String })],
  ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (path) => {
    const route = createRoute({
      name: 'simple',
      path,
      component,
    })

    expect(() => assembleUrl(route, {})).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['/simple/[simple]'],
    [withParams('/simple/[simple]', { simple: String })],
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
    [withParams('simple=abc', {})],
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
    [withParams('simple=[?simple]', { simple: String })],
    [withParams('simple=[?simple]', { simple: withDefault(String, 'abc') })],
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
    [withParams('simple=[?simple]', { simple: String })],
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
      query: withParams('simple=[simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const url = assembleUrl(route, { params: { simple: '' } })

    expect(url).toBe('/?simple=')
  })

  test.each([
    ['simple=[?simple]'],
    [withParams('simple=[?simple]', { simple: String })],
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
      query: withParams('simple=[simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const url = assembleUrl(route, {
      params: { simple: 'DEF' },
    })

    expect(url).toBe('/?simple=DEF')
  })

  test.each([
    ['simple=[simple]'],
    [withParams('simple=[simple]', { simple: String })],
  ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (query) => {
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
    [withParams('simple=[simple]', { simple: String })],
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

  test('given route with optional custom param, finds and uses param to set value', () => {
    const randomValue = Math.floor(Math.random() * 1000)
    const get = vi.fn()
    const set = vi.fn().mockReturnValue(randomValue.toString())
    const myParam = createParam({ get, set })

    const route = createRoute({
      name: 'simple',
      path: '/',
      query: withParams('sort=[?sort]', { sort: myParam }),
      component,
    })

    const url = assembleUrl(route, { params: { sort: 'irrelevant' } })

    expect(url).toBe(`/?sort=${randomValue}`)
  })

  test('given route with multiple empty and optional query params, removes both from url', () => {
    const parent = createRoute({
      query: 'search=[?search]',
    })

    const route = createRoute({
      parent,
      name: 'simple',
      path: '/',
      query: withParams('sort=[?sort]', { sort: Boolean }),
      component,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/')
  })

  test('given route with query params with different param names than query keys, still works as expected', () => {
    const route = createRoute({
      name: 'query-keys',
      path: '/',
      query: 's=[?search]',
    })

    const url = assembleUrl(route, { params: { search: 'foo' } })

    expect(url).toBe('/?s=foo')
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
    ['https://kitbag.dev'],
    [withParams('https://kitbag.dev', {})],
  ])('given simple route with string host and without params, returns route host', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route)

    expect(url).toBe('https://kitbag.dev/')
  })

  test.each([
    ['https://[?subdomain]kitbag.dev'],
    [withParams('https://[?subdomain]kitbag.dev', { subdomain: String })],
    [withParams('https://[?subdomain]kitbag.dev', { subdomain: withDefault(String, 'abc') })],
  ])('given route with optional param NOT provided, leaves entire key off', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route)

    expect(url).toBe('https://kitbag.dev/')
  })

  test.each([
    ['https://[?subdomain]kitbag.dev'],
    [withParams('https://[?subdomain]kitbag.dev', { subdomain: String })],
  ])('given route with optional string param provided, returns route Host with string with values interpolated', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route, {
      params: { subdomain: 'ABC.' },
    })

    expect(url).toBe('https://abc.kitbag.dev/')
  })

  test('given route with default string param provided, returns route Host with string with values interpolated', () => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host: withParams('https://[?subdomain]kitbag.dev', { subdomain: withDefault(String, 'abc.') }),
    })

    const url = assembleUrl(route, {
      params: { subdomain: 'DEF.' },
    })

    expect(url).toBe('https://def.kitbag.dev/')
  })

  test.each([
    ['https://[subdomain]kitbag.dev'],
    [withParams('https://[subdomain]kitbag.dev', { subdomain: String })],
  ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    expect(() => assembleUrl(route)).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['https://[subdomain]kitbag.dev'],
    [withParams('https://[subdomain]kitbag.dev', { subdomain: String })],
  ])('given route with required string param provided, returns route Host with string with values interpolated', (host) => {
    const route = createExternalRoute({
      name: 'simple',
      path: '/',
      host,
    })

    const url = assembleUrl(route, {
      params: { subdomain: 'ABC.' },
    })

    expect(url).toBe('https://abc.kitbag.dev/')
  })
})

describe('hash params', () => {
  test.each([
    ['foo'],
    [withParams('foo', {})],
  ])('given simple route with string hash and without params, returns route hash', (hash) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      hash,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/#foo')
  })

  test.each([
    ['foo[?bar]'],
    [withParams('foo[?bar]', { bar: String })],
    [withParams('foo[?bar]', { bar: withDefault(String, 'abc') })],
  ])('given route with optional param NOT provided, returns route hash with string without values interpolated', (hash) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      hash,
    })

    const url = assembleUrl(route)

    expect(url).toBe('/#foo')
  })

  test.each([
    ['foo[?bar]'],
    [withParams('foo[?bar]', { bar: String })],
  ])('given route with optional string param provided, returns route Hash with string with values interpolated', (hash) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      hash,
    })

    const url = assembleUrl(route, {
      params: { bar: 'ABC.' },
    })

    expect(url).toBe('/#fooABC.')
  })

  test('given route with default string param provided, returns route Hash with string with values interpolated', () => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      hash: withParams('foo[?bar]', { bar: withDefault(String, 'abc.') }),
    })

    const url = assembleUrl(route, {
      params: { bar: 'DEF.' },
    })

    expect(url).toBe('/#fooDEF.')
  })

  test.each([
    ['foo[bar]'],
    [withParams('foo[bar]', { bar: String })],
  ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (hash) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      hash,
    })

    expect(() => assembleUrl(route)).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['foo[bar]'],
    [withParams('foo[bar]', { bar: String })],
  ])('given route with required string param provided, returns route Hash with string with values interpolated', (hash) => {
    const route = createRoute({
      name: 'simple',
      path: '/',
      hash,
    })

    const url = assembleUrl(route, {
      params: { bar: 'ABC' },
    })

    expect(url).toBe('/#fooABC')
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

test('given route without host that does not start with a forward slash, returns url with forward slash', () => {
  const route = createRoute({
    name: 'invalid-relative-path',
    path: 'foo',
  })

  const url = assembleUrl(route)

  expect(url).toBe('/foo')
})

test('given route with host that does not start with a protocol, returns url with protocol', () => {
  const route = createExternalRoute({
    name: 'invalid-host-protocol',
    path: '/foo',
    host: 'kitbag.dev',
  })

  const url = assembleUrl(route)

  expect(url).toBe('https://kitbag.dev/foo')
})

test('given route with host and path without forward slash, returns forward slash after host', () => {
  const route = createExternalRoute({
    name: 'missing-delimiter-after-host',
    path: 'foo',
    host: 'https://kitbag.dev',
  })

  const url = assembleUrl(route)

  expect(url).toBe('https://kitbag.dev/foo')
})

test('given route with host and path with excess forward slashes, returns forward slash after host', () => {
  const route = createExternalRoute({
    name: 'extra-delimiter-after-host',
    path: '/foo',
    host: 'https://kitbag.dev/',
  })

  const url = assembleUrl(route)

  expect(url).toBe('https://kitbag.dev/foo')
})
