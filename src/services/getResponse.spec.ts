import { expect, test } from 'vitest'
import { getResponse, GetResponseContext } from '@/services/getResponse'
import { Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'

function route(href: string): ResolvedRoute {
  return { href } as ResolvedRoute
}

function context(overrides: Partial<GetResponseContext> = {}): GetResponseContext {
  return {
    initialUrl: '/foo',
    route: route('/foo'),
    rejection: null,
    removeTrailingSlashes: true,
    ...overrides,
  }
}

test('given the settled route matches the initial url, returns 200', () => {
  expect(getResponse(context())).toStrictEqual({ status: 200, rejection: null })
})

test('given a trailing slash on the initial url, returns 301 to the settled url', () => {
  const response = getResponse(context({ initialUrl: '/foo/' }))

  expect(response).toStrictEqual({ status: 301, location: '/foo', rejection: null })
})

test('given removeTrailingSlashes is false, does not return 301', () => {
  const response = getResponse(context({ initialUrl: '/foo/', removeTrailingSlashes: false }))

  expect(response.status).not.toBe(301)
})

test('given the NotFound rejection, returns 404', () => {
  const rejection: Rejection = { type: 'NotFound', status: 404 }
  const response = getResponse(context({ rejection }))

  expect(response).toStrictEqual({ status: 404, rejection: 'NotFound' })
})

test('given a rejection with a status, returns that status', () => {
  const rejection: Rejection = { type: 'Unauthorized', status: 401 }
  const response = getResponse(context({ rejection }))

  expect(response).toStrictEqual({ status: 401, rejection: 'Unauthorized' })
})

test('given a rejection without a status, returns 200', () => {
  const rejection: Rejection = { type: 'Maintenance' }
  const response = getResponse(context({ rejection }))

  expect(response).toStrictEqual({ status: 200, rejection: 'Maintenance' })
})

test('given a rejection, prefers it over a redirect', () => {
  const rejection: Rejection = { type: 'Unauthorized', status: 401 }
  const response = getResponse(context({ rejection, route: route('/bar') }))

  expect(response.status).toBe(401)
})

test('given the settled url differs from the initial url, returns 302 to it', () => {
  const response = getResponse(context({ route: route('/bar') }))

  expect(response).toStrictEqual({ status: 302, location: '/bar', rejection: null })
})

test('given an absolute initial url and a relative settled url, does not report a redirect', () => {
  const response = getResponse(context({ initialUrl: 'https://kitbag.dev/foo' }))

  expect(response.status).toBe(200)
})

test('given query params the router reordered, does not report a redirect', () => {
  const response = getResponse(context({
    initialUrl: '/foo?extra=42&bar=1',
    route: route('/foo?bar=1&extra=42'),
  }))

  expect(response.status).toBe(200)
})
