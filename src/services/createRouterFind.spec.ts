import { expect, test } from 'vitest'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { createRouter } from '@/services/createRouter'
import { routes } from '@/utilities'

test('when given a name that matches a route return that route', () => {
  const router = createRouter(routes, { initialUrl: '/' })

  const route = router.find('parentB')

  expect(route).toBeDefined()
  expect(route?.name).toBe('parentB')
})

test('when given a url that matches a route returns that route', () => {
  const router = createRouter(routes, { initialUrl: '/' })
  const route = router.find('/parentB')

  expect(route).toBeDefined()
  expect(route?.name).toBe('parentB')
})

test('when given a name that does not match a route returns undefined', () => {
  const router = createRouter(routes, { initialUrl: '/' })

  // @ts-expect-error route doesn't exist
  expect(() => router.find('parentD')).toThrow(RouteNotFoundError)
})

test('when given a url that does not match a route returns undefined', () => {
  const router = createRouter(routes, { initialUrl: '/' })
  const route = router.find('/parentC')

  expect(route).toBeUndefined()
})

test('when given a url that does not match a route returns undefined', () => {
  const router = createRouter(routes, { initialUrl: '/' })
  const route = router.find('/does-not-exist')

  expect(route).toBeUndefined()
})

test('when given an external url that does not match a route returns undefined', () => {
  const router = createRouter(routes, { initialUrl: '/' })
  const route = router.find('https://example.com')

  expect(route).toBeUndefined()
})
