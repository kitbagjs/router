import { describe, expect, test } from 'vitest'
import { Route } from '@/types'
import { resolveRoutes, routeParamsAreValid, path } from '@/utilities'
import { component } from '@/utilities/testHelpers'

describe('routeParamsAreValid', () => {
  test('given route WITHOUT params, always return true', () => {
    const route: Route = {
      name: 'no-params',
      path: '/no-params',
      component,
    }
    const [resolved] = resolveRoutes([route])

    const response = routeParamsAreValid('/no-params', resolved)

    expect(response).toBe(true)
  })

  test('given route with simple string param and value present, returns true', () => {
    const route: Route = {
      name: 'simple-params',
      path: '/simple/:simple',
      component,
    }
    const [resolved] = resolveRoutes([route])

    const response = routeParamsAreValid('/simple/ABC', resolved)

    expect(response).toBe(true)
  })

  test('given route with OPTIONAL string param WITHOUT value present, returns true', () => {
    const route: Route = {
      name: 'simple-params',
      path: '/simple/:?simple',
      component,
    }
    const [resolved] = resolveRoutes([route])

    const response = routeParamsAreValid('/simple/', resolved)

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
    const [resolved] = resolveRoutes([route])

    const response = routeParamsAreValid('/simple/123', resolved)

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
    const [resolved] = resolveRoutes([route])

    const response = routeParamsAreValid('/simple/fail', resolved)

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
    const [resolved] = resolveRoutes([route])

    const response = routeParamsAreValid('/simple/fail', resolved)

    expect(response).toBe(false)
  })
})