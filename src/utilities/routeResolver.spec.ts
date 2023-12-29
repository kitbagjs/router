import { describe, expect, test } from 'vitest'
import { Route, Routes } from '@/types'
import { resolveRoutes, path } from '@/utilities'

const component = { template: '<div>This is component</div>' }

describe('resolveRoutes', () => {
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

    const response = resolveRoutes(routes)

    expect(response).toHaveLength(6)
  })

  test.each([
    ['/:accountId'],
    [path('/:accountId', { accountId: Number })],
  ])('always combines paths into return path', (path) => {
    const childRoute: Route = {
      name: 'new-account',
      path,
      component,
    }

    const parentRoute: Route = {
      name: 'accounts',
      path: '/accounts',
      children: [childRoute],
    }

    const routes = resolveRoutes([parentRoute])
    const resolvedChild = routes.find(route => route.name === childRoute.name)

    expect(resolvedChild?.path).toBe(`${parentRoute.path}/:accountId`)
  })

  describe('matches', () => {
    test('given 3 levels, returns all parent routes in matches', () => {
      const childRoute = {
        name: 'child',
        path: '/child',
        component,
      } satisfies Route
      const parentRoute = {
        name: 'parent',
        path: '/parent',
        children: [childRoute],
      } satisfies Route
      const grandparentRoute = {
        name: 'grandparent',
        path: '/grandparent',
        children: [parentRoute],
      } satisfies Route
      const unrelatedRoute = {
        name: 'unrelated',
        path: '/unrelated',
        component,
      } satisfies Route

      const [child, parent, grandparent] = resolveRoutes([grandparentRoute, unrelatedRoute])

      expect(grandparent.matches).toMatchObject([grandparentRoute])
      expect(parent.matches).toMatchObject([grandparentRoute, parentRoute])
      expect(child.matches).toMatchObject([grandparentRoute, parentRoute, childRoute])
    })
  })
})