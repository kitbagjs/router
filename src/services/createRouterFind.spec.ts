import { expect, test } from 'vitest'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { createRouterFind } from '@/services/createRouterFind'
import { routes } from '@/utilities'

test('when given a key that matches a route return that route', () => {
  const find = createRouterFind(routes)

  const route = find('parentB')

  expect(route).toBeDefined()
  expect(route?.key).toBe('parentB')
})

test('when given a url that matches a route returns that route', () => {
  const find = createRouterFind(routes)
  const route = find('/parentB')

  expect(route).toBeDefined()
  expect(route?.key).toBe('parentB')
})

test('when given a key that does not match a route returns undefined', () => {
  const find = createRouterFind(routes)

  // @ts-expect-error
  expect(() => find('parentD')).toThrow(RouteNotFoundError)
})

test('when given a url that does not match a route returns undefined', () => {
  const find = createRouterFind(routes)
  const route = find('/parentC')

  expect(route).toBeUndefined()
})

test('when given a url that does not match a route returns undefined', () => {
  const find = createRouterFind(routes)
  const route = find('/does-not-exist')

  expect(route).toBeUndefined()
})

test('when given an external url that does not match a route returns undefined', () => {
  const find = createRouterFind(routes)
  const route = find('https://example.com')

  expect(route).toBeUndefined()
})