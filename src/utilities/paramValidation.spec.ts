import { describe, expect, test } from 'vitest'
import { RouteFlat } from '@/types'
import { generateRouteRegexPattern, routeParamsAreValid } from '@/utilities'

describe('routeParamsAreValid', () => {
  test('given route without params, always return true', () => {
    const path = '/no-params'
    const route: RouteFlat = {
      name: 'no-params',
      path: '/no-params',
      regex: generateRouteRegexPattern('/no-params'),
      params: {},
    }

    const response = routeParamsAreValid(path, route)

    expect(response).toBe(true)
  })

  test('given route with params, always return true', () => {
    const path = '/ABC'
    const route: RouteFlat = {
      name: 'simple-params',
      path: '/:simple',
      regex: generateRouteRegexPattern('/:simple'),
      params: {
        simple: [String],
      },
    }

    const response = routeParamsAreValid(path, route)

    expect(response).toBe(true)
  })
})