import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getRouteParamValues, routeParamsAreValid } from '@/services/paramValidation'
import { path } from '@/services/path'
import { withDefault } from '@/services/withDefault'
import { component } from '@/utilities/testHelpers'

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
    path: path('/simple/[?simple]', { simple: withDefault(String, 'abc') }),
    component,
  })

  const response = routeParamsAreValid(route, '/simple/')

  expect(response).toBe(true)
})

test('given route with non-string param with value that satisfies, returns true', () => {
  const route = createRoute({
    name: 'simple-params',
    path: path('/simple/[simple]', {
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
    path: path('/simple/[simple]', {
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
    path: path('/simple/[?simple]', {
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
    path: path('/simple/[?simple]', {
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
    path: path('/supports/[slashes]/bookmarked', { slashes: /first\/second\/third/g }),
    component,
  })

  const response = routeParamsAreValid(route, '/supports/first/second/third/bookmarked')

  expect(response).toBe(true)
})

test.each([
  ['/[sameId]/[SameId]/[SAMEID]'],
  [
    path('/[sameId]/[SameId]/[SAMEID]', {
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

// test.each([
//   { path: '/duplicate/[foo]', query: 'params=[?foo]' },
//   { path: '/duplicate/[foo]', host: 'https://[foo].kitbag.dev' },
//   { path: '/', host: 'https://[?foo].kitbag.dev', query: 'params=[?foo]' },
//   { path: '/duplicate/[foo]', host: 'https://[foo].kitbag.dev', query: 'params=[foo]' },
// ])('given route with duplicate param names across path and query, throws DuplicateParamsError', (route) => {
//   const action: () => void = () => createExternalRoutes([
//     {
//       name: 'different-cased-params',
//       ...route,
//       component,
//     })

//   expect(action).toThrowError(DuplicateParamsError)
// })

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

  const input = escapeCodes.map(code => code.encoded).join('')
  const output = escapeCodes.map(code => code.decoded).join('')

  const route = createRoute({ name: 'test', path: '/[inPath]', query: 'inQuery=[inQuery]', component })
  const response = getRouteParamValues(route, `/${input}?inQuery=${input}`)

  expect(response.inPath).toBe(output)
  expect(response.inQuery).toBe(output)
})