import { describe, expect, test } from 'vitest'
import { Route, Routes, optional } from '@/types'
import { flattenRoutes, generateRouteRegexPattern, getRouteParams, path } from '@/utilities'

const component = { template: '<div>This is component</div>' }

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
            component,
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
            component,
          },
          {
            name: 'account',
            path: '/:accountId',
            children: [
              {
                name: 'edit-account',
                path: '/edit',
                component,
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
      component,
    }

    const parentRoute: Route = {
      name: 'accounts',
      path: '/accounts',
      children: [childRoute],
    }

    const [response] = flattenRoutes([parentRoute])

    expect(response.path).toBe(parentRoute.path + childRoute.path)
  })

  test('given path not as string, still combines to fullPath', () => {
    const childRoute: Route = {
      name: 'edit-account',
      path: path('/:accountId', {
        accountId: Number,
      }),
      component,
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

describe('getRouteParams', () => {
  test('given path without params, returns empty object', () => {
    const path = '/string/example/without/params'

    const response = getRouteParams(path)

    expect(response).toMatchObject({})
  })

  test('given path with simple params, returns each param name as type String', () => {
    const path = '/parent/:parentId/child/:childId'

    const response = getRouteParams(path)

    expect(response).toMatchObject({
      parentId: String,
      childId: String,
    })
  })

  test('given path with optional params, returns each param name as type String with optional', () => {
    const path = '/parent/:?parentId/child/:?childId'

    const response = getRouteParams(path)

    expect(JSON.stringify(response)).toMatch(JSON.stringify({
      parentId: optional(String),
      childId: optional(String),
    }))
  })

  test('given path not as string, returns each param with corresponding param', () => {
    const pathValue = path('/parent/:parentId/child/:childId', {
      parentId: Boolean,
    })

    const response = getRouteParams(pathValue)

    expect(response).toMatchObject({
      parentId: Boolean,
      childId: String,
    })
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
    const input = 'parent/child/:childParam/grand-child/:grandChild123'

    const result = generateRouteRegexPattern(input)

    const catchAll = '([^/]+)'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`)
    expect(result.toString()).toBe(expected.toString())
  })

  test('given path with optional params, returns value with params replaced with catchall', () => {
    const input = 'parent/child/:?childParam/grand-child/:?grandChild123'

    const result = generateRouteRegexPattern(input)

    const catchAll = '([^/]*)'
    const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`)
    expect(result.toString()).toBe(expected.toString())
  })
})