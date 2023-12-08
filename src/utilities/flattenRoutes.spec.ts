import { describe, expect, test } from 'vitest'
import { Route, Routes } from '@/types'
import { flattenRoutes, generateRouteRegexPattern } from '@/utilities/flattenRoutes'

describe('flattenRoutes', () => {
  test('always returns 1 record per named route', () => {
    const routes = [
      {
        name: 'foo',
        path: '/foo/:fparam/:fparam',
        children: [
          {
            name: 'bar',
            path: '/bar/:bparam',
          },
        ],
      },
      {
        name: 'accounts',
        path: '/accounts',
        children: [
          {
            name: 'new-account',
            path: '/new',
          },
          {
            name: 'account',
            path: '/:accountId',
            children: [
              {
                name: 'edit-account',
                path: '/edit',
              },
            ],
          },
        ],
      },
    ] as const satisfies Routes

    const response = flattenRoutes(routes)

    expect(response).toHaveLength(6)
  })

  test('always combines paths into return value', () => {
    const childRoute: Route = {
      name: 'new-account',
      path: '/new',
    }

    const parentRoute: Route = {
      name: 'accounts',
      path: '/accounts',
      children: [childRoute],
    }

    const [response] = flattenRoutes([parentRoute])

    expect(response.path).toBe(parentRoute.path + childRoute.path)
  })
})

describe('generateRouteRegexPattern', () => {
  test('given path without params, returns unmodified value with start and end markers', () => {
    const input = 'parent/child/grandchild'

    const result = generateRouteRegexPattern(input)

    const expected = new RegExp(`^${input}$`)
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with params, returns value with params replaced with catchall', () => {
    const input = 'parent/child/:child-param/grand-child/:grandChild123'

    const result = generateRouteRegexPattern(input)

    const catchAll = '([^/]+)'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`)
    expect(result.toString()).toBe(expected.toString())
  })
})