import { expect, test } from 'vitest'
import { Route } from '@/types'
import { createRouter } from '@/utilities/createRouter'
import { component } from '@/utilities/testHelpers'

test('when given a string returns that string', () => {
  const route = {
    name: 'route',
    path: '/route/:param',
    component,
  } as const satisfies Route

  const { resolve } = createRouter([route], {
    initialUrl: '/route/bar',
  })

  expect(resolve('/route/bar')).toBe('/route/bar')
})

test('when given a route method returns the url', () => {
  const route = {
    name: 'route',
    path: '/route/:param',
    component,
  } as const satisfies Route

  const { resolve, routes } = createRouter([route], {
    initialUrl: '/route/bar',
  })

  expect(resolve(routes.route({ param: 'bar' }))).toBe('/route/bar')
})

test('when given a route with params returns the url', () => {
  const route = {
    name: 'route',
    path: '/route/:param',
    component,
  } as const satisfies Route

  const { resolve } = createRouter([route], {
    initialUrl: '/route/bar',
  })

  expect(resolve({ route: 'route', params: { param: 'bar' } })).toBe('/route/bar')
})

test('throws an error if route with params cannot be matched', () => {
  const route = {
    name: 'route',
    path: '/route/:param',
    component,
  } as const satisfies Route

  const { resolve } = createRouter([route], {
    initialUrl: '/route/bar',
  })

  expect(() => resolve({ route: 'foo' })).toThrowError()
})