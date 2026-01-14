import { describe, expect, test, vi } from 'vitest'
import { createUrl } from '@/services/createUrl'
import { withParams } from './withParams'
import { withDefault } from './withDefault'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createParam } from './createParam'
import { createRoute } from './createRoute'

describe('parseUrl', () => {
  test('given parts without host, protocol, or path, returns forward slash to satisfy Url', () => {
    const url = createUrl({})

    expect(url.toString()).toBe('/')
  })

  test.each(['foo', '/foo'])('given parts with path, returns value with path', (path) => {
    const parts = {
      host: 'https://kitbag.dev',
      path,
    }

    const url = createUrl(parts)

    expect(url.toString()).toBe('https://kitbag.dev/foo')
  })

  test.each(['?bar=123', 'bar=123'])('given parts with query, returns value with query', (query) => {
    const parts = {
      host: 'https://kitbag.dev',
      query,
    }

    const url = createUrl(parts)

    expect(url.toString()).toBe('https://kitbag.dev/?bar=123')
  })

  test.each(['bar', '#bar'])('given parts with hash, returns value with hash', (hash) => {
    const parts = {
      host: 'https://kitbag.dev',
      hash,
    }

    const url = createUrl(parts)

    expect(url.toString()).toBe('https://kitbag.dev/#bar')
  })

  test('given parts without host, returns url starting with forward slash', () => {
    const parts = {
      path: '/foo',
      query: '?bar=123',
    }

    const url = createUrl(parts)

    expect(url.toString()).toBe('/foo?bar=123')
  })

  test.each([
    { host: 'https://router.kitbag.dev' },
    { host: 'https://github.io' },
  ])('given parts with host, returns value that satisfies Url', (parts) => {
    const url = createUrl(parts)

    expect(url.toString()).toBe(`${parts.host}/`)
  })
})

describe('param validation', () => {
  test('given params in each part of the URL, extracts them', () => {
    const input = 'foo'

    const url = createUrl({
      host: 'https://[inHost].dev',
      path: '/[inPath]',
      query: 'inQuery=[inQuery]',
      hash: '[inHash]',
    })
    const response = url.parse(`https://${input}.dev/${input}?inQuery=${input}#${input}`)

    expect(response.inHost).toBe(input)
    expect(response.inPath).toBe(input)
    expect(response.inQuery).toBe(input)
    expect(response.inHash).toBe(`#${input}`)
  })

  test('given value with encoded URL characters, decodes those characters', () => {
    const escapeCodes = [
      { decoded: ' ', encoded: '%20' },
      { decoded: '<', encoded: '%3C' },
      { decoded: '>', encoded: '%3E' },
      { decoded: '#', encoded: '%23' },
      { decoded: '%', encoded: '%25' },
      { decoded: '{', encoded: '%7B' },
      { decoded: '}', encoded: '%7D' },
      { decoded: '|', encoded: '%7C' },
      { decoded: '\\', encoded: '%5C' },
      { decoded: '^', encoded: '%5E' },
      { decoded: '~', encoded: '%7E' },
      { decoded: '[', encoded: '%5B' },
      { decoded: ']', encoded: '%5D' },
      { decoded: '`', encoded: '%60' },
      { decoded: ';', encoded: '%3B' },
      { decoded: '?', encoded: '%3F' },
      { decoded: ':', encoded: '%3A' },
      { decoded: '@', encoded: '%40' },
      { decoded: '=', encoded: '%3D' },
      { decoded: '&', encoded: '%26' },
      { decoded: '$', encoded: '%24' },
    ]

    const input = escapeCodes.map((code) => code.encoded).join('')
    const output = escapeCodes.map((code) => code.decoded).join('')

    const url = createUrl({
      path: '/[inPath]',
      query: 'inQuery=[inQuery]',
      hash: '[inHash]',
    })
    const response = url.parse(`/${input}?inQuery=${input}#${input}`)

    expect(response.inPath).toBe(output)
    expect(response.inQuery).toBe(output)
    expect(response.inHash).toBe(`#${output}`)
  })

  test('given url with query param that has a different param name than query key, still works as expected', () => {
    const url = createUrl({
      path: '/',
      query: 's=[?search]',
    })

    const response = url.parse('/?s=foo')

    expect(response.search).toBe('foo')
  })
})

describe('url assembly', () => {
  describe('path params', () => {
    test.each([
      ['/simple'],
      [withParams('/simple', {})],
    ])('given simple route with string path and without params, returns route path', (path) => {
      const url = createUrl({
        name: 'simple',
        path,
      })

      const response = url.toString()

      expect(response).toBe('/simple')
    })

    test.each([
      ['/simple/[?simple]'],
      [withParams('/simple/[?simple]', { simple: String })],
      [withParams('/simple/[?simple]', { simple: withDefault(String, 'abc') })],
    ])('given route with optional string param NOT provided, returns route Path with string without values interpolated', (path) => {
      const url = createUrl({
        name: 'simple',
        path,
      })

      const response = url.toString()

      expect(response).toBe('/simple/')
    })

    test.each([
      ['/simple/[?simple]'],
      [withParams('/simple/[?simple]', { simple: String })],
    ])('given route with optional string param provided, returns route Path with string with values interpolated', (path) => {
      const url = createUrl({
        name: 'simple',
        path,
      })

      const response = url.toString({
        simple: 'ABC',
      })

      expect(response).toBe('/simple/ABC')
    })

    test('given route with default string param provided, returns route Path with string with values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: withParams('/simple/[simple]', { simple: withDefault(String, 'abc') }),
      })

      const response = url.toString({
        simple: 'DEF',
      })

      expect(response).toBe('/simple/DEF')
    })

    test.each([
      ['/simple/[simple]'],
      [withParams('/simple/[simple]', { simple: String })],
    ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (path) => {
      const url = createUrl({
        name: 'simple',
        path,
      })

      expect(() => url.toString()).toThrowError(InvalidRouteParamValueError)
    })

    test.each([
      ['/simple/[simple]'],
      [withParams('/simple/[simple]', { simple: String })],
    ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
      const url = createUrl({
        name: 'simple',
        path,
      })

      const response = url.toString({
        simple: 'ABC',
      })

      expect(response).toBe('/simple/ABC')
    })
  })

  describe('query params', () => {
    test.each([
      ['simple=abc'],
      [withParams('simple=abc', {})],
    ])('given simple route with string query and without params, returns route query', (query) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query,
      })

      const response = url.toString()

      expect(response).toBe('/?simple=abc')
    })

    test.each([
      ['simple=[?simple]'],
      [withParams('simple=[?simple]', { simple: String })],
      [withParams('simple=[?simple]', { simple: withDefault(String, 'abc') })],
    ])('given route with optional param NOT provided, leaves entire key off', (query) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query,
      })

      const response = url.toString()

      expect(response).toBe('/')
    })

    test.each([
      ['simple=[?simple]'],
      [withParams('simple=[?simple]', { simple: String })],
    ])('given route with optional string param provided but empty, returns route Query with string without values interpolated', (query) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query,
      })

      const response = url.toString({ simple: '' })

      expect(response).toBe('/?simple=')
    })

    test('given route with default string param provided but empty, returns route Query with string without values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query: withParams('simple=[simple]', { simple: withDefault(String, 'abc') }),
      })

      const response = url.toString({ simple: '' })

      expect(response).toBe('/?simple=')
    })

    test.each([
      ['simple=[?simple]'],
      [withParams('simple=[?simple]', { simple: String })],
    ])('given route with optional string param provided, returns route Query with string with values interpolated', (query) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query,
      })

      const response = url.toString({
        simple: 'ABC',
      })

      expect(response).toBe('/?simple=ABC')
    })

    test('given route with default string param provided, returns route Query with string with values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query: withParams('simple=[simple]', { simple: withDefault(String, 'abc') }),
      })

      const response = url.toString({
        simple: 'DEF',
      })

      expect(response).toBe('/?simple=DEF')
    })

    test.each([
      ['simple=[simple]'],
      [withParams('simple=[simple]', { simple: String })],
    ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (query) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query,
      })

      expect(() => url.toString()).toThrowError(InvalidRouteParamValueError)
    })

    test.each([
      ['simple=[simple]'],
      [withParams('simple=[simple]', { simple: String })],
    ])('given route with required string param provided, returns route Query with string with values interpolated', (query) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query,
      })

      const response = url.toString({
        simple: 'ABC',
      })

      expect(response).toBe('/?simple=ABC')
    })

    test('given route with optional custom param, finds and uses param to set value', () => {
      const randomValue = Math.floor(Math.random() * 1000)
      const get = vi.fn()
      const set = vi.fn().mockReturnValue(randomValue.toString())
      const myParam = createParam({ get, set })

      const url = createUrl({
        name: 'simple',
        path: '/',
        query: withParams('sort=[?sort]', { sort: myParam }),
      })

      const response = url.toString({ sort: 'irrelevant' })

      expect(response).toBe(`/?sort=${randomValue}`)
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
      })

      const response = route.toString()

      expect(response).toBe('/')
    })

    test('given route with query params with different param names than query keys, still works as expected', () => {
      const url = createUrl({
        name: 'query-keys',
        path: '/',
        query: 's=[?search]',
      })

      const response = url.toString({ search: 'foo' })

      expect(response).toBe('/?s=foo')
    })
  })

  // this was all moved to createResolvedRoute
  describe('static query', () => {
    test('given a static query returns route with query values added', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
      })

      const response = url.toString({}, {
        query: { simple: 'ABC' },
      })

      expect(response).toBe('/?simple=ABC')
    })

    test('given a route with a query and a static query returns route with query values added', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query: 'foo=foo',
      })

      const response = url.toString({}, {
        query: { simple: 'ABC' },
      })

      expect(response).toBe('/?foo=foo&simple=ABC')
    })
  })

  describe('host params', () => {
    test.each([
      ['https://kitbag.dev'],
      [withParams('https://kitbag.dev', {})],
    ])('given simple route with string host and without params, returns route host', (host) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        host,
      })

      const response = url.toString()

      expect(response).toBe('https://kitbag.dev/')
    })

    test.each([
      ['https://[?subdomain]kitbag.dev'],
      [withParams('https://[?subdomain]kitbag.dev', { subdomain: String })],
      [withParams('https://[?subdomain]kitbag.dev', { subdomain: withDefault(String, 'abc') })],
    ])('given route with optional param NOT provided, leaves entire key off', (host) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        host,
      })

      const response = url.toString()

      expect(response).toBe('https://kitbag.dev/')
    })

    test.each([
      ['https://[?subdomain]kitbag.dev'],
      [withParams('https://[?subdomain]kitbag.dev', { subdomain: String })],
    ])('given route with optional string param provided, returns route Host with string with values interpolated', (host) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        host,
      })

      const response = url.toString({
        subdomain: 'ABC.',
      })

      expect(response).toBe('https://abc.kitbag.dev/')
    })

    test('given route with default string param provided, returns route Host with string with values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        host: withParams('https://[?subdomain]kitbag.dev', { subdomain: withDefault(String, 'abc.') }),
      })

      const response = url.toString({
        subdomain: 'DEF.',
      })

      expect(response).toBe('https://def.kitbag.dev/')
    })

    test.each([
      ['https://[subdomain]kitbag.dev'],
      [withParams('https://[subdomain]kitbag.dev', { subdomain: String })],
    ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (host) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        host,
      })

      expect(() => url.toString()).toThrowError(InvalidRouteParamValueError)
    })

    test.each([
      ['https://[subdomain]kitbag.dev'],
      [withParams('https://[subdomain]kitbag.dev', { subdomain: String })],
    ])('given route with required string param provided, returns route Host with string with values interpolated', (host) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        host,
      })

      const response = url.toString({
        subdomain: 'ABC.',
      })

      expect(response).toBe('https://abc.kitbag.dev/')
    })
  })

  describe('hash params', () => {
    test.each([
      ['foo'],
      [withParams('foo', {})],
    ])('given simple route with string hash and without params, returns route hash', (hash) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        hash,
      })

      const response = url.toString()

      expect(response).toBe('/#foo')
    })

    test.each([
      ['foo[?bar]'],
      [withParams('foo[?bar]', { bar: String })],
      [withParams('foo[?bar]', { bar: withDefault(String, 'abc') })],
    ])('given route with optional param NOT provided, returns route hash with string without values interpolated', (hash) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        hash,
      })

      const response = url.toString()

      expect(response).toBe('/#foo')
    })

    test.each([
      ['foo[?bar]'],
      [withParams('foo[?bar]', { bar: String })],
    ])('given route with optional string param provided, returns route Hash with string with values interpolated', (hash) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        hash,
      })

      const response = url.toString({
        bar: 'ABC.',
      })

      expect(response).toBe('/#fooABC.')
    })

    test('given route with default string param provided, returns route Hash with string with values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        hash: withParams('foo[?bar]', { bar: withDefault(String, 'abc.') }),
      })

      const response = url.toString({
        bar: 'DEF.',
      })

      expect(response).toBe('/#fooDEF.')
    })

    test.each([
      ['foo[bar]'],
      [withParams('foo[bar]', { bar: String })],
    ])('given route with required string param NOT provided, throws InvalidRouteParamValueError', (hash) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        hash,
      })

      expect(() => url.toString()).toThrowError(InvalidRouteParamValueError)
    })

    test.each([
      ['foo[bar]'],
      [withParams('foo[bar]', { bar: String })],
    ])('given route with required string param provided, returns route Hash with string with values interpolated', (hash) => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        hash,
      })

      const response = url.toString({
        bar: 'ABC',
      })

      expect(response).toBe('/#fooABC')
    })
  })

  // this used to be part of URL Assembly, now part of createResolvedRoute
  test('given route with hash, returns url with hash value interpolated', () => {
    const url = createUrl({
      name: 'simple',
      path: '/',
    })

    const response = url.toString({}, { hash: 'foo' })

    expect(response).toBe('/#foo')
  })

  test('given route without host that does not start with a forward slash, returns url with forward slash', () => {
    const url = createUrl({
      name: 'invalid-relative-path',
      path: 'foo',
    })

    const response = url.toString()

    expect(response).toBe('/foo')
  })

  test('given route with host and path without forward slash, returns forward slash after host', () => {
    const url = createUrl({
      name: 'missing-delimiter-after-host',
      path: 'foo',
      host: 'https://kitbag.dev',
    })

    const response = url.toString()

    expect(response).toBe('https://kitbag.dev/foo')
  })

  test('given route with host and path with excess forward slashes, returns forward slash after host', () => {
    const url = createUrl({
      name: 'extra-delimiter-after-host',
      path: '/foo',
      host: 'https://kitbag.dev/',
    })

    const response = url.toString()

    expect(response).toBe('https://kitbag.dev/foo')
  })
})

describe('url parser', () => {
  test('given relative url, returns host and protocol undefined', () => {
    const url = '/foo?bar=123'

    const parts = createUrl(url)

    expect(parts.host.toString()).toBe('')
  })

  test('given absolute url with path, returns everything up to pathname', () => {
    const url = 'https://kitbag.dev/foo'

    const parts = createUrl(url)

    expect(parts.host.toString()).toBe('https://kitbag.dev')
    expect(parts.path.toString()).toBe('/foo')
    expect(parts.query.toString()).toBe('')
    expect(parts.hash.toString()).toBe('')
  })

  test('given absolute url with path and query, returns everything up to search', () => {
    const url = 'https://kitbag.dev/foo?bar=123'

    const parts = createUrl(url)

    expect(parts.host.toString()).toBe('https://kitbag.dev')
    expect(parts.path.toString()).toBe('/foo')
    expect(parts.query.toString()).toBe('bar=123')
    expect(parts.hash.toString()).toBe('')
  })

  test('given absolute url with path, query, and hash, returns everything', () => {
    const url = 'https://kitbag.dev/foo?bar=123#zoo'

    const parts = createUrl(url)

    expect(parts.host.toString()).toBe('https://kitbag.dev')
    expect(parts.path.toString()).toBe('/foo')
    expect(parts.query.toString()).toBe('bar=123')
    expect(parts.hash.toString()).toBe('#zoo')
  })
})
