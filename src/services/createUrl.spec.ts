import { describe, expect, test, vi } from 'vitest'
import { createUrl } from '@/services/createUrl'
import { withParams } from './withParams'
import { withDefault } from './withDefault'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createParam } from './createParam'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'

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
        path,
      })

      const response = url.stringify({
        simple: 'ABC',
      })

      expect(response).toBe('/simple/ABC')
    })

    test('given route with default string param provided, returns route Path with string with values interpolated', () => {
      const url = createUrl({
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
        path,
      })

      expect(() => url.stringify()).toThrowError(InvalidRouteParamValueError)
    })

    test.each([
      ['/simple/[simple]'],
      [withParams('/simple/[simple]', { simple: String })],
    ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
      const url = createUrl({
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
        path: '/',
        query,
      })

      const response = url.stringify({ simple: '' })

      expect(response).toBe('/?simple=')
    })

    test('given route with default string param provided but empty, returns route Query with string without values interpolated', () => {
      const url = createUrl({
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
        path: '/',
        query: withParams('sort=[?sort]', { sort: myParam }),
      })

      const response = url.stringify({ sort: 'irrelevant' })

      expect(response).toBe(`/?sort=${randomValue}`)
    })

    test('given route with query params with different param names than query keys, still works as expected', () => {
      const url = createUrl({
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
      path: 'foo',
    })

    const response = url.stringify()

    expect(response).toBe('/foo')
  })

  test('given route with host and path without forward slash, returns forward slash after host', () => {
    const url = createUrl({
      path: 'foo',
      host: 'https://kitbag.dev',
    })

    const response = url.stringify()

    expect(response).toBe('https://kitbag.dev/foo')
  })

  test('given route with host and path with excess forward slashes, returns forward slash after host', () => {
    const url = createUrl({
      path: '/foo',
      host: 'https://kitbag.dev/',
    })

    const response = url.stringify()

    expect(response).toBe('https://kitbag.dev/foo')
  })
})

describe('route.match', () => {
  test('given a route without a host, returns true', () => {
    const urlWithHost = 'http://www.kitbag.io/'
    const route = createUrl({
    })

    const response = route.match(urlWithHost)

    expect(response).toBe(true)
  })

  test('given url without host and a route with a host, returns false', () => {
    const urlWithoutHost = '/somewhere?with=query'
    const route = createUrl({
      host: 'https://www.kitbag.io',
    })

    const response = route.match(urlWithoutHost)

    expect(response).toBe(false)
  })

  test.each([
    ['https://www.kitbag.io'],
    ['https://www.kitbag.io/'],
    ['https://www.kitbag.io/is/empty'],
    ['https://www.kitbag.io/is/empty?with=query'],
  ])('given url (%s) and route.host that does NOT match, returns false', (url) => {
    const route = createUrl({
      host: 'https://www.vuejs.org',
    })

    const response = route.match(url)

    expect(response).toBe(false)
  })

  test.each([
    ['https://www.kitbag.io'],
    ['https://www.kitbag.io/'],
    ['https://www.kitbag.io/is/empty'],
    ['https://www.kitbag.io/is/empty?with=query'],
  ])('given url (%s) and route.host that does match, returns true', (url) => {
    const route = createUrl({
      host: 'https://www.kitbag.io',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test('given url with matching host but different protocol, returns false', () => {
    const urlWithInsecureProtocol = 'http://www.kitbag.io'
    const route = createUrl({
      host: 'https://www.kitbag.io',
    })

    const response = route.match(urlWithInsecureProtocol)

    expect(response).toBe(false)
  })

  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/is/empty'],
    ['http://www.kitbag.io/is/empty?with=query'],
  ])('given url (%s) and route.path that does NOT match, returns false', (url) => {
    const route = createUrl({
      path: '/not/empty',
    })

    const response = route.match(url)

    expect(response).toBe(false)
  })

  test.each([
    ['/without/params'],
    ['http://www.kitbag.io/without/params'],
  ])('given url (%s) and route.path WITHOUT params that does match, returns true', (url) => {
    const route = createUrl({
      path: '/without/params',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test('route matching logic is case insensitive', () => {
    const route = createUrl({
      path: '/without/params',
    })

    const response = route.match('/WITHOUT/params')

    expect(response).toBe(true)
  })

  test.each([
    ['/with/true/params/true'],
    ['/with/%/params/%'],
    ['http://www.kitbag.io/with/a/params/b'],
  ])('given url (%s) and route.path with params that does match, returns true', (url) => {
    const route = createUrl({
      path: '/with/[some]/params/[inPath]',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test('given route with extra slashes in param value, does match', () => {
    const route = createUrl({
      path: '/supports/[slashes]/bookmarked',
    })
    const response = route.match('/supports/first/second/third/bookmarked')

    expect(response).toBe(true)
  })

  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/empty'],
    ['http://www.kitbag.io/empty?with=query'],
    ['http://www.kitbag.io/empty?not=emptyish'],
  ])('given url (%s) and route.query p that does NOT match, returns false', (url) => {
    const route = createUrl({
      query: 'not=empty',
    })

    const response = route.match(url)

    expect(response).toBe(false)
  })

  test.each([
    ['?without=params&static=true'],
    ['http://www.kitbag.io?without=params&static=true'],
  ])('given url (%s) and route.query WITHOUT params that does match, returns true', (url) => {
    const route = createUrl({
      query: 'without=params&static=true',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test.each([
    ['?with=true&static=false'],
    ['?with=%20&static=%20'],
    ['http://www.kitbag.io?with=a&static=b'],
    ['http://www.kitbag.io/some/path?with=a&static=b'],
  ])('given url (%s) and route.query with params that does match, returns true', (url) => {
    const route = createUrl({
      query: 'with=[params]&static=[dynamic]',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test.each([
    ['?optional'],
    ['?optional='],
    ['?optional=true'],
    ['http://www.kitbag.io?extra=params&optional=provided'],
  ])('given url (%s) and route.query with optional params that does match, returns true', (url) => {
    const route = createUrl({
      query: 'optional=[?optional]',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test.each([
    [''],
    ['?'],
    ['?default'],
    ['?default='],
    ['?default=true'],
    ['http://www.kitbag.io?extra=params&default=provided'],
  ])('given url (%s) and route.query with default params that does match, returns true', (url) => {
    const route = createUrl({
      query: withParams('default=[?default]', { default: withDefault(String, 'abc') }),
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test('given url that as additional unexpected query params, returns true', () => {
    const route = createUrl({
      query: 'expected=value',
    })

    const response = route.match('www.kitbag.io/some/path?expected=value&unexpected=ok')

    expect(response).toBe(true)
  })

  test('given url with query params in random order, returns true', () => {
    const route = createUrl({
      query: 'first=1&second=2&third=3',
    })

    const response = route.match('www.kitbag.io/some/path?second=2&first=1&third=3')

    expect(response).toBe(true)
  })

  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/empty'],
    ['http://www.kitbag.io/empty#'],
    ['http://www.kitbag.io/empty#bar'],
  ])('given a route with no hash, returns true', (url) => {
    const route = createUrl({
      path: '/',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/empty'],
    ['http://www.kitbag.io/empty#'],
    ['http://www.kitbag.io/empty#bar'],
  ])('given url (%s) and route.hash that does NOT match, returns false', (url) => {
    const route = createUrl({
      path: '/',
      hash: 'foo',
    })

    const response = route.match(url)

    expect(response).toBe(false)
  })

  test.each([
    ['http://www.kitbag.io/#'],
    ['http://www.kitbag.io/#bar'],
  ])('given url (%s) and route.hash with params that does match, returns true', (url) => {
    const route = createUrl({
      path: '/',
      hash: '#[param]',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test.each([
    ['/#foo'],
    ['http://www.kitbag.io/#foo'],
  ])('given url (%s) and route.hash WITHOUT params that does match, returns true', (url) => {
    const route = createUrl({
      path: '/',
      hash: 'foo',
    })

    const response = route.match(url)

    expect(response).toBe(true)
  })

  test('route matching logic is case insensitive', () => {
    const route = createUrl({
      path: '/',
      hash: 'foo',
    })

    const response = route.match('/#FOO')

    expect(response).toBe(true)
  })

  test('given route WITHOUT params, always return true', () => {
    const route = createUrl({
      path: '/no-params',
    })

    const response = route.match('/no-params')

    expect(response).toBe(true)
  })

  test('given route with simple string param and value present, returns true', () => {
    const route = createUrl({
      path: '/simple/[simple]',
    })

    const response = route.match('/simple/ABC')

    expect(response).toBe(true)
  })

  test('given route with OPTIONAL string param WITHOUT value present, returns true', () => {
    const route = createUrl({
      path: '/simple/[?simple]',
    })

    const response = route.match('/simple/')

    expect(response).toBe(true)
  })

  test('given route with DEFAULT string param WITHOUT value present, returns true', () => {
    const route = createUrl({
      path: withParams('/simple/[?simple]', { simple: withDefault(String, 'abc') }),
    })

    const response = route.match('/simple/')

    expect(response).toBe(true)
  })

  test('given route with non-string param with value that satisfies, returns true', () => {
    const route = createUrl({
      path: withParams('/simple/[simple]', {
        simple: Number,
      }),
    })

    const response = route.match('/simple/123')

    expect(response).toBe(true)
  })

  test('given route with non-string param with value that does NOT satisfy, returns false', () => {
    const route = createUrl({
      path: withParams('/simple/[simple]', {
        simple: Number,
      }),
    })

    const response = route.match('/simple/fail')

    expect(response).toBe(false)
  })

  test('given route with OPTIONAL non-string param with value that does NOT satisfy, returns false', () => {
    const route = createUrl({
      path: withParams('/simple/[?simple]', {
        simple: Number,
      }),
    })

    const response = route.match('/simple/fail')

    expect(response).toBe(false)
  })

  test('given route with DEFAULT non-string param with value that does NOT satisfy, returns false', () => {
    const route = createUrl({
      path: withParams('/simple/[?simple]', {
        simple: withDefault(Number, 42),
      }),
    })

    const response = route.match('/simple/fail')

    expect(response).toBe(false)
  })

  test('given route with regex param that expects forward slashes, will match', () => {
    const route = createUrl({
      path: withParams('/supports/[slashes]/bookmarked', { slashes: /first\/second\/third/g }),
    })

    const response = route.match('/supports/first/second/third/bookmarked')

    expect(response).toBe(true)
  })

  test.each([
    ['/[sameId]/[SameId]/[SAMEID]'],
    [
      withParams('/[sameId]/[SameId]/[SAMEID]', {
        sameId: String,
        SameId: Number,
        SAMEID: Boolean,
      }),
    ],
  ])('given route with the same param name of different casing, treats params separately', (path) => {
    const route = createUrl({
      path,
    })

    const response = route.match('/ABC/123/true')

    expect(response).toBe(true)
  })

  test.each([
    { path: '/duplicate/[foo]', host: 'https://router.kitbag.dev', query: 'params=[?foo]' },
    { path: '/duplicate/[foo]', host: 'https://[foo].kitbag.dev' },
    { path: '/', host: 'https://[?foo].kitbag.dev', query: 'params=[?foo]' },
    { path: '/duplicate/[foo]', host: 'https://[foo].kitbag.dev', query: 'params=[foo]' },
  ])('given route with duplicate param names across path and query, throws DuplicateParamsError', (route) => {
    const action: () => void = () => createUrl({
      ...route,
    })

    expect(action).toThrowError(DuplicateParamsError)
  })
})

describe('route.match score', () => {
  test('given route without query, returns 0', () => {
    const route = createUrl({
      path: '/',
    })
    const actualQuery = new URLSearchParams('/?can=have&some=queries')

    const response = route.match(actualQuery.toString())

    expect(response).toBe(0)
  })

  test('given route with query where url has keys but different values, still counts as present', () => {
    const route = createUrl({
      path: '/',
      query: 'value=blue',
    })
    const actualQuery = new URLSearchParams('value=red')

    const response = route.match(actualQuery.toString())

    expect(response).toBe(1)
  })

  test('given route with query all included in url in any order, returns count of route queries', () => {
    const route = createUrl({
      path: '/',
      query: 'one=1&two=2&three=3&four=4',
    })
    const actualQuery = new URLSearchParams('three=3&one=1&four=4&two=2')

    const response = route.match(actualQuery.toString())

    expect(response).toBe(4)
  })

  test('given route with query with some missing from url, returns count not missing', () => {
    const route = createUrl({
      path: '/',
      query: 'one=1&two=2&three=3&four=4',
    })
    const actualQuery = new URLSearchParams('one=1&three=3')

    const response = route.match(actualQuery.toString())

    expect(response).toBe(2)
  })
})

// describe('getRouteScoreSortMethod', () => {
//   test('given routes with different path scores, returns them sorted by path score descending', () => {
//     const aRoute = createUrl({
//       path: '[?color]',
//     })
//     const bRoute = createUrl({
//       path: '[?color]/[?id]',
//     })

//     // const sortByRouteScore = getRouteScoreSortMethod('/red/123')
//     // const expected = [bRoute, aRoute]

//     // expect([aRoute, bRoute].sort(sortByRouteScore)).toMatchObject(expected)
//     // expect([bRoute, aRoute].sort(sortByRouteScore)).toMatchObject(expected)
//   })

//   test('given routes with equal path scores, returns them sorted by route depth descending', () => {
//     const lowerRoute = createUrl({
//       path: '/[?color]',
//     })

//     const higherRoute = createUrl({
//       path: '/',
//     })

//     const higherRouteChild = createUrl({
//       parent: higherRoute,
//       path: '[?color]',
//     })

//     const routes = [lowerRoute, higherRoute, higherRouteChild]

//     // const sortByRouteScore = getRouteScoreSortMethod('/red')
//     // const response = routes.sort(sortByRouteScore)
//     // const matchNames = response.map((route) => route.matched.name)

//     // expect(matchNames).toMatchObject(['higher-depth-child', 'lower-depth', 'higher-depth'])
//   })

//   test('given routes with different query scores, returns them sorted by query score descending', () => {
//     const aRoute = createUrl({
//       path: '/',
//       query: 'color=red',
//     })
//     const bRoute = createUrl({
//       path: '/',
//       query: 'color=red&id=1',
//     })

//     // const sortByRouteScore = getRouteScoreSortMethod('/?color=red&id=1&extra=ok')
//     // const expected = [bRoute, aRoute]

//     // expect([aRoute, bRoute].sort(sortByRouteScore)).toMatchObject(expected)
//     // expect([bRoute, aRoute].sort(sortByRouteScore)).toMatchObject(expected)
//   })

//   test('given routes that are otherwise equal, prefers routes with matching host', () => {
//     const externalRoute = createUrl({
//       path: '/same-path',
//       host: 'https://kitbag.dev',
//     })

//     const internalRoute = createUrl({
//       path: '/same-path',
//     })

//     // const sortByRouteScore = getRouteScoreSortMethod('https://kitbag.dev/same-path')
//     // const expected = [externalRoute, internalRoute]

//     // expect([externalRoute, internalRoute].sort(sortByRouteScore)).toMatchObject(expected)
//     // expect([internalRoute, externalRoute].sort(sortByRouteScore)).toMatchObject(expected)
//   })

//   test('given routes that are otherwise equal, prefers routes with matching hash', () => {
//     const aRoute = createUrl({
//       path: '/same-path',
//     })

//     const bRoute = createUrl({
//       path: '/same-path',
//       hash: '#123',
//     })

//     // const sortByRouteScore = getRouteScoreSortMethod('/same-path#123')
//     // const expected = [bRoute, aRoute]

//     // expect([aRoute, bRoute].sort(sortByRouteScore)).toMatchObject(expected)
//     // expect([bRoute, aRoute].sort(sortByRouteScore)).toMatchObject(expected)
//   })

//   test('given routes with equal query scores, returns them sorted by route depth descending', () => {
//     const lowerRoute = createUrl({
//       path: '/',
//       query: 'color=red',
//     })

//     const higherRoute = createUrl({
//       path: '/',
//     })

//     const higherRouteChild = createUrl({
//       parent: higherRoute,
//       query: 'color=red',
//     })

//     const routes = [
//       lowerRoute,
//       higherRoute,
//       higherRouteChild,
//     ]

//     // const sortByRouteScore = getRouteScoreSortMethod('/?color=red&extra=ok')
//     // const response = routes.sort(sortByRouteScore)

//     // expect(response.map((route) => route.matched.name)).toMatchObject(['higher-depth-child', 'lower-depth', 'higher-depth'])
//   })
// })
