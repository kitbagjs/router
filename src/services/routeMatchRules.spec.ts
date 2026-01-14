import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { routeHashMatches, routeHostMatches, routeParamsAreValid, routePathMatches, routeQueryMatches } from '@/services/routeMatchRules'
import { withDefault } from '@/services/withDefault'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'
import { createExternalRoute } from '@/services/createExternalRoute'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'

describe('routeHostMatches', () => {
  test('given a route without a host, returns true', () => {
    const urlWithHost = 'http://www.kitbag.io/'
    const route = createRoute({
      name: 'without-host',
    })

    const response = routeHostMatches(route, urlWithHost)

    expect(response).toBe(true)
  })

  test('given url without host and a route with a host, returns false', () => {
    const urlWithoutHost = '/somewhere?with=query'
    const route = createExternalRoute({
      name: 'with-host',
      host: 'https://www.kitbag.io',
    })

    const response = routeHostMatches(route, urlWithoutHost)

    expect(response).toBe(false)
  })

  test.each([
    ['https://www.kitbag.io'],
    ['https://www.kitbag.io/'],
    ['https://www.kitbag.io/is/empty'],
    ['https://www.kitbag.io/is/empty?with=query'],
  ])('given url (%s) and route.host that does NOT match, returns false', (url) => {
    const route = createExternalRoute({
      name: 'not-matches',
      host: 'https://www.vuejs.org',
    })

    const response = routeHostMatches(route, url)

    expect(response).toBe(false)
  })

  test.each([
    ['https://www.kitbag.io'],
    ['https://www.kitbag.io/'],
    ['https://www.kitbag.io/is/empty'],
    ['https://www.kitbag.io/is/empty?with=query'],
  ])('given url (%s) and route.host that does match, returns true', (url) => {
    const route = createExternalRoute({
      name: 'host-matches',
      host: 'https://www.kitbag.io',
    })

    const response = routeHostMatches(route, url)

    expect(response).toBe(true)
  })

  test('given url with matching host but different protocol, returns false', () => {
    const urlWithInsecureProtocol = 'http://www.kitbag.io'
    const route = createExternalRoute({
      name: 'secure-protocol',
      host: 'https://www.kitbag.io',
    })

    const response = routeHostMatches(route, urlWithInsecureProtocol)

    expect(response).toBe(false)
  })
})

describe('routePathMatches', () => {
  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/is/empty'],
    ['http://www.kitbag.io/is/empty?with=query'],
  ])('given url (%s) and route.path that does NOT match, returns false', (url) => {
    const route = createRoute({
      name: 'not-matches',
      path: '/not/empty',
      component,
    })

    const response = routePathMatches(route, url)

    expect(response).toBe(false)
  })

  test.each([
    ['/without/params'],
    ['http://www.kitbag.io/without/params'],
  ])('given url (%s) and route.path WITHOUT params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'no-params',
      path: '/without/params',
      component,
    })

    const response = routePathMatches(route, url)

    expect(response).toBe(true)
  })

  test('route matching logic is case insensitive', () => {
    const route = createRoute({
      name: 'no-params',
      path: '/without/params',
      component,
    })

    const response = routePathMatches(route, '/WITHOUT/params')

    expect(response).toBe(true)
  })

  test.each([
    ['/with/true/params/true'],
    ['/with/%/params/%'],
    ['http://www.kitbag.io/with/a/params/b'],
  ])('given url (%s) and route.path with params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'no-params',
      path: '/with/[some]/params/[inPath]',
      component,
    })

    const response = routePathMatches(route, url)

    expect(response).toBe(true)
  })

  test('given route with extra slashes in param value, does match', () => {
    const route = createRoute({
      name: 'support-slashes',
      path: '/supports/[slashes]/bookmarked',
      component,
    })
    const response = routePathMatches(route, '/supports/first/second/third/bookmarked')

    expect(response).toBe(true)
  })
})

describe('routeQueryMatches', () => {
  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/empty'],
    ['http://www.kitbag.io/empty?with=query'],
    ['http://www.kitbag.io/empty?not=emptyish'],
  ])('given url (%s) and route.query that does NOT match, returns false', (url) => {
    const route = createRoute({
      name: 'not-matches',
      query: 'not=empty',
      component,
    })

    const response = routeQueryMatches(route, url)

    expect(response).toBe(false)
  })

  test.each([
    ['?without=params&static=true'],
    ['http://www.kitbag.io?without=params&static=true'],
  ])('given url (%s) and route.query WITHOUT params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'no-params',
      query: 'without=params&static=true',
      component,
    })

    const response = routeQueryMatches(route, url)

    expect(response).toBe(true)
  })

  test.each([
    ['?with=true&static=false'],
    ['?with=%20&static=%20'],
    ['http://www.kitbag.io?with=a&static=b'],
    ['http://www.kitbag.io/some/path?with=a&static=b'],
  ])('given url (%s) and route.query with params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'no-params',
      query: 'with=[params]&static=[dynamic]',
      component,
    })

    const response = routeQueryMatches(route, url)

    expect(response).toBe(true)
  })

  test.each([
    ['?optional'],
    ['?optional='],
    ['?optional=true'],
    ['http://www.kitbag.io?extra=params&optional=provided'],
  ])('given url (%s) and route.query with optional params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'optional-params',
      query: 'optional=[?optional]',
      component,
    })

    const response = routeQueryMatches(route, url)

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
    const route = createRoute({
      name: 'default-params',
      query: withParams('default=[?default]', { default: withDefault(String, 'abc') }),
      component,
    })

    const response = routeQueryMatches(route, url)

    expect(response).toBe(true)
  })

  test('given url that as additional unexpected query params, returns true', () => {
    const route = createRoute({
      name: 'extra-params',
      query: 'expected=value',
      component,
    })

    const response = routeQueryMatches(route, 'www.kitbag.io/some/path?expected=value&unexpected=ok')

    expect(response).toBe(true)
  })

  test('given url with query params in random order, returns true', () => {
    const route = createRoute({
      name: 'extra-params',
      query: 'first=1&second=2&third=3',
      component,
    })

    const response = routeQueryMatches(route, 'www.kitbag.io/some/path?second=2&first=1&third=3')

    expect(response).toBe(true)
  })
})

describe('routeHashMatches', () => {
  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/empty'],
    ['http://www.kitbag.io/empty#'],
    ['http://www.kitbag.io/empty#bar'],
  ])('given a route with no hash, returns true', (url) => {
    const route = createRoute({
      name: 'no-hash',
      path: '/',
      component,
    })

    const response = routeHashMatches(route, url)

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
    const route = createRoute({
      name: 'not-matches',
      path: '/',
      component,
      hash: 'foo',
    })

    const response = routeHashMatches(route, url)

    expect(response).toBe(false)
  })

  test.each([
    ['http://www.kitbag.io/#'],
    ['http://www.kitbag.io/#bar'],
  ])('given url (%s) and route.hash with params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'no-params',
      path: '/',
      hash: '#[param]',
      component,
    })

    const response = routePathMatches(route, url)

    expect(response).toBe(true)
  })

  test.each([
    ['/#foo'],
    ['http://www.kitbag.io/#foo'],
  ])('given url (%s) and route.hash WITHOUT params that does match, returns true', (url) => {
    const route = createRoute({
      name: 'hash-matches',
      path: '/',
      component,
      hash: 'foo',
    })

    const response = routeHashMatches(route, url)

    expect(response).toBe(true)
  })

  test('route matching logic is case insensitive', () => {
    const route = createRoute({
      name: 'hash-matches',
      path: '/',
      component,
      hash: 'foo',
    })

    const response = routeHashMatches(route, '/#FOO')

    expect(response).toBe(true)
  })
})

describe('routeParamsAreValid', () => {
  test('given route WITHOUT params, always return true', () => {
    const route = createRoute({
      name: 'no-params',
      path: '/no-params',
      component,
    })

    const response = routeParamsAreValid(route, '/no-params')

    expect(response).toBe(true)
  })

  test('given route with simple string param and value present, returns true', () => {
    const route = createRoute({
      name: 'simple-params',
      path: '/simple/[simple]',
      component,
    })

    const response = routeParamsAreValid(route, '/simple/ABC')

    expect(response).toBe(true)
  })

  test('given route with OPTIONAL string param WITHOUT value present, returns true', () => {
    const route = createRoute({
      name: 'simple-params',
      path: '/simple/[?simple]',
      component,
    })

    const response = routeParamsAreValid(route, '/simple/')

    expect(response).toBe(true)
  })

  test('given route with DEFAULT string param WITHOUT value present, returns true', () => {
    const route = createRoute({
      name: 'simple-params',
      path: withParams('/simple/[?simple]', { simple: withDefault(String, 'abc') }),
      component,
    })

    const response = routeParamsAreValid(route, '/simple/')

    expect(response).toBe(true)
  })

  test('given route with non-string param with value that satisfies, returns true', () => {
    const route = createRoute({
      name: 'simple-params',
      path: withParams('/simple/[simple]', {
        simple: Number,
      }),
      component,
    })

    const response = routeParamsAreValid(route, '/simple/123')

    expect(response).toBe(true)
  })

  test('given route with non-string param with value that does NOT satisfy, returns false', () => {
    const route = createRoute({
      name: 'simple-params',
      path: withParams('/simple/[simple]', {
        simple: Number,
      }),
      component,
    })

    const response = routeParamsAreValid(route, '/simple/fail')

    expect(response).toBe(false)
  })

  test('given route with OPTIONAL non-string param with value that does NOT satisfy, returns false', () => {
    const route = createRoute({
      name: 'simple-params',
      path: withParams('/simple/[?simple]', {
        simple: Number,
      }),
      component,
    })

    const response = routeParamsAreValid(route, '/simple/fail')

    expect(response).toBe(false)
  })

  test('given route with DEFAULT non-string param with value that does NOT satisfy, returns false', () => {
    const route = createRoute({
      name: 'simple-params',
      path: withParams('/simple/[?simple]', {
        simple: withDefault(Number, 42),
      }),
      component,
    })

    const response = routeParamsAreValid(route, '/simple/fail')

    expect(response).toBe(false)
  })

  test('given route with regex param that expects forward slashes, will match', () => {
    const route = createRoute({
      name: 'support-slashes',
      path: withParams('/supports/[slashes]/bookmarked', { slashes: /first\/second\/third/g }),
      component,
    })

    const response = routeParamsAreValid(route, '/supports/first/second/third/bookmarked')

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
    const route = createRoute({
      name: 'different-cased-params',
      path,
      component,
    })

    const response = routeParamsAreValid(route, '/ABC/123/true')

    expect(response).toBe(true)
  })

  test.each([
    { path: '/duplicate/[foo]', host: 'https://router.kitbag.dev', query: 'params=[?foo]' },
    { path: '/duplicate/[foo]', host: 'https://[foo].kitbag.dev' },
    { path: '/', host: 'https://[?foo].kitbag.dev', query: 'params=[?foo]' },
    { path: '/duplicate/[foo]', host: 'https://[foo].kitbag.dev', query: 'params=[foo]' },
  ])('given route with duplicate param names across path and query, throws DuplicateParamsError', (route) => {
    const action: () => void = () => createExternalRoute({
      name: 'different-cased-params',
      ...route,
    })

    expect(action).toThrowError(DuplicateParamsError)
  })
})
