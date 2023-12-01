import { describe, expect, test, vi } from 'vitest'
import { Route, Routes } from '@/types'
import { flattenRoutes } from '@/utilities/flattenRoutes'

describe('flattenRoutes', () => {
  test('always returns 1 record per leaf', () => {
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

    expect(response).toHaveLength(3)
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

  test('always replaces param syntax with regex catchall', () => {
    const childRoute: Route = {
      name: 'view-account',
      path: '/:accountId',
    }

    const parentRoute: Route = {
      name: 'accounts',
      path: '/accounts',
      children: [childRoute],
    }

    const [response] = flattenRoutes([parentRoute])

    const catchAll = '(.*?)'
    const expectedPattern = new RegExp(`${parentRoute.path }/${ catchAll}`)
    expect(response.regex.toString()).toBe(expectedPattern.toString())
  })
})