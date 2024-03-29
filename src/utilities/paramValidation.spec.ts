import { describe, expect, test } from 'vitest'
import { Route } from '@/types'
import { createRouterRoutes, routeParamsAreValid, path, getRouteParamValues } from '@/utilities'
import { component } from '@/utilities/testHelpers'

test('given route WITHOUT params, always return true', () => {
  const route: Route = {
    name: 'no-params',
    path: '/no-params',
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/no-params')

  expect(response).toBe(true)
})

test('given route with simple string param and value present, returns true', () => {
  const route: Route = {
    name: 'simple-params',
    path: '/simple/:simple',
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/simple/ABC')

  expect(response).toBe(true)
})

test('given route with OPTIONAL string param WITHOUT value present, returns true', () => {
  const route: Route = {
    name: 'simple-params',
    path: '/simple/:?simple',
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/simple/')

  expect(response).toBe(true)
})

test('given route with non-string param with value that satisfies, returns true', () => {
  const route: Route = {
    name: 'simple-params',
    path: path('/simple/:simple', {
      simple: Number,
    }),
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/simple/123')

  expect(response).toBe(true)
})

test('given route with non-string param with value that does NOT satisfy, returns false', () => {
  const route: Route = {
    name: 'simple-params',
    path: path('/simple/:simple', {
      simple: Number,
    }),
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/simple/fail')

  expect(response).toBe(false)
})

test('given route with OPTIONAL non-string param with value that does NOT satisfy, returns false', () => {
  const route: Route = {
    name: 'simple-params',
    path: path('/simple/:?simple', {
      simple: Number,
    }),
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/simple/fail')

  expect(response).toBe(false)
})

test('given route with regex param that expects forward slashes, will NOT match', () => {
  const route: Route = {
    name: 'support-slashes',
    path: path('/supports/:slashes/bookmarked', { slashes: /first\/second\/third/g }),
    component,
  }

  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/supports/first/second/third/bookmarked')

  expect(response).toBe(false)
})

test.each([
  ['/:sameId/:SameId/:SAMEID'],
  [
    path('/:sameId/:SameId/:SAMEID', {
      sameId: String,
      SameId: Number,
      SAMEID: Boolean,
    }),
  ],
])('given route with the same param name of different casing, treats params separately', (path) => {
  const route: Route = {
    name: 'different-cased-params',
    path,
    component,
  }
  const [routerRoutes] = createRouterRoutes([route])

  const response = routeParamsAreValid(routerRoutes, '/ABC/123/true')

  expect(response).toBe(true)
})

describe('getRouteParamValues', () => {
  test('given route with path params and query params of the same name, combines both', () => {
    const route: Route = {
      name: 'duplicate-names',
      path: '/:foo',
      query: 'foo=:foo',
      component,
    }

    const [routerRoutes] = createRouterRoutes([route])

    const response = getRouteParamValues(routerRoutes, '/first-foo?foo=second-foo')

    expect(response).toHaveProperty('foo')
    expect(response.foo).toMatchObject(['first-foo', 'second-foo'])
  })
})