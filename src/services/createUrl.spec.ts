import { describe, expect, test, vi } from 'vitest'
import { createUrl } from '@/services/createUrl'
import { withParams } from './withParams'
import { withDefault } from './withDefault'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createParam } from './createParam'

test('given a query that starts with "?", strips the leading "?"', () => {
  const url = createUrl({ query: '?foo=123' })

  expect(url.stringify()).toBe('/?foo=123')
})

test('given a hash that starts with "#", strips the leading "#"', () => {
  const url = createUrl({ hash: '#foo' })
  expect(url.stringify()).toBe('/#foo')
})

describe('parseUrl', () => {
  test('given parts without host, protocol, or path, returns forward slash to satisfy Url', () => {
    const url = createUrl({})

    expect(url.stringify()).toBe('/')
  })

  test.each(['foo', '/foo'])('given parts with path, returns value with path', (path) => {
    const parts = {
      host: 'https://kitbag.dev',
      path,
    }

    const url = createUrl(parts)

    expect(url.stringify()).toBe('https://kitbag.dev/foo')
  })

  test.each(['?bar=123', 'bar=123'])('given parts with query, returns value with query', (query) => {
    const parts = {
      host: 'https://kitbag.dev',
      query,
    }

    const url = createUrl(parts)

    expect(url.stringify()).toBe('https://kitbag.dev/?bar=123')
  })

  test.each(['bar', '#bar'])('given parts with hash, returns value with hash', (hash) => {
    const parts = {
      host: 'https://kitbag.dev',
      hash,
    }

    const url = createUrl(parts)

    expect(url.stringify()).toBe('https://kitbag.dev/#bar')
  })

  test('given parts without host, returns url starting with forward slash', () => {
    const parts = {
      path: '/foo',
      query: '?bar=123',
    }

    const url = createUrl(parts)

    expect(url.stringify()).toBe('/foo?bar=123')
  })

  test.each([
    { host: 'https://router.kitbag.dev' },
    { host: 'https://github.io' },
  ])('given parts with host, returns value that satisfies Url', (parts) => {
    const url = createUrl(parts)

    expect(url.stringify()).toBe(`${parts.host}/`)
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

      const response = url.stringify()

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

      const response = url.stringify()

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

      const response = url.stringify({
        simple: 'ABC',
      })

      expect(response).toBe('/simple/ABC')
    })

    test('given route with default string param provided, returns route Path with string with values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: withParams('/simple/[simple]', { simple: withDefault(String, 'abc') }),
      })

      const response = url.stringify({
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

      expect(() => url.stringify()).toThrowError(InvalidRouteParamValueError)
    })

    test.each([
      ['/simple/[simple]'],
      [withParams('/simple/[simple]', { simple: String })],
    ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
      const url = createUrl({
        name: 'simple',
        path,
      })

      const response = url.stringify({
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

      const response = url.stringify()

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

      const response = url.stringify()

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

      const response = url.stringify({ simple: '' })

      expect(response).toBe('/?simple=')
    })

    test('given route with default string param provided but empty, returns route Query with string without values interpolated', () => {
      const url = createUrl({
        name: 'simple',
        path: '/',
        query: withParams('simple=[simple]', { simple: withDefault(String, 'abc') }),
      })

      const response = url.stringify({ simple: '' })

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

      const response = url.stringify({
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

      const response = url.stringify({
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

      expect(() => url.stringify()).toThrowError(InvalidRouteParamValueError)
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

      const response = url.stringify({
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

      const response = url.stringify({ sort: 'irrelevant' })

      expect(response).toBe(`/?sort=${randomValue}`)
    })

    test('given route with query params with different param names than query keys, still works as expected', () => {
      const url = createUrl({
        name: 'query-keys',
        path: '/',
        query: 's=[?search]',
      })

      const response = url.stringify({ search: 'foo' })

      expect(response).toBe('/?s=foo')
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

      const response = url.stringify()

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

      const response = url.stringify()

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

      const response = url.stringify({
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

      const response = url.stringify({
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

      expect(() => url.stringify()).toThrowError(InvalidRouteParamValueError)
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

      const response = url.stringify({
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

      const response = url.stringify()

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

      const response = url.stringify()

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

      const response = url.stringify({
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

      const response = url.stringify({
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

      expect(() => url.stringify()).toThrowError(InvalidRouteParamValueError)
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

      const response = url.stringify({
        bar: 'ABC',
      })

      expect(response).toBe('/#fooABC')
    })
  })

  test('given route without host that does not start with a forward slash, returns url with forward slash', () => {
    const url = createUrl({
      name: 'invalid-relative-path',
      path: 'foo',
    })

    const response = url.stringify()

    expect(response).toBe('/foo')
  })

  test('given route with host and path without forward slash, returns forward slash after host', () => {
    const url = createUrl({
      name: 'missing-delimiter-after-host',
      path: 'foo',
      host: 'https://kitbag.dev',
    })

    const response = url.stringify()

    expect(response).toBe('https://kitbag.dev/foo')
  })

  test('given route with host and path with excess forward slashes, returns forward slash after host', () => {
    const url = createUrl({
      name: 'extra-delimiter-after-host',
      path: '/foo',
      host: 'https://kitbag.dev/',
    })

    const response = url.stringify()

    expect(response).toBe('https://kitbag.dev/foo')
  })
})
