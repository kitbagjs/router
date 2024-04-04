import { describe, expect, test } from 'vitest'
import { Route, Routes } from '@/types'
import { createRouterRoutes, path, query } from '@/utilities'
import { component } from '@/utilities/testHelpers'

describe('resolveRoutes', () => {
  test('given no named routes, returns empty array', () => {
    const routes = [
      {
        path: 'foo',
        children: [],
      },
      {
        path: 'bar',
        children: [
          {
            path: 'zoo',
            children: [],
          },
        ],
      },
    ] as const satisfies Routes

    const routerRoutes = createRouterRoutes(routes)

    expect(routerRoutes).toMatchObject([])
  })

  test('always returns 1 record per named route', () => {
    const routes = [
      {
        name: 'foo',
        path: '/foo/:fparam',
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

    const response = createRouterRoutes(routes)

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

    const routes = createRouterRoutes([parentRoute])
    const routerRouteChild = routes.find(route => route.name === childRoute.name)

    expect(routerRouteChild?.path).toBe(`${String(parentRoute.path)}/:accountId`)
  })

  test.each([
    ['id=:accountId'],
    [query('id=:accountId', { accountId: Number })],
  ])('always combines query into return query', (query) => {
    const childRoute: Route = {
      name: 'new-account',
      path: '/new-account',
      query: 'handle=:?handle',
      component,
    }

    const parentRoute: Route = {
      name: 'accounts',
      path: '/accounts',
      query,
      children: [childRoute],
    }

    const routes = createRouterRoutes([parentRoute])
    const routerRouteChild = routes.find(route => route.name === childRoute.name)

    expect(routerRouteChild?.query).toBe('id=:accountId&handle=:?handle')
  })

  test('always combines path params into return pathParams', () => {
    const childRoute: Route = {
      name: 'account',
      path: '/account/:accountId',
      component,
    }

    const parentRoute: Route = {
      name: 'workspace',
      path: '/workspace/:workspaceId',
      children: [childRoute],
    }

    const routes = createRouterRoutes([parentRoute])
    const routerRouteChild = routes.find(route => route.name === childRoute.name)

    expect(routerRouteChild?.pathParams).toMatchObject({ workspaceId: String, accountId: String })
  })

  test('always combines query params into return queryParams', () => {
    const childRoute: Route = {
      name: 'account',
      path: '/account',
      query: 'handle=:handle',
      component,
    }

    const parentRoute: Route = {
      name: 'workspace',
      path: '/workspace',
      query: 'start=?:startDate',
      children: [childRoute],
    }

    const routes = createRouterRoutes([parentRoute])
    const routerRouteChild = routes.find(route => route.name === childRoute.name)

    expect(routerRouteChild?.queryParams).toMatchObject({ startDate: String, handle: String })
  })

  test('always returns depth equal to distance from root', () => {
    const routes = [
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

    const response = createRouterRoutes(routes)

    const routerRouteAccountsRoute = response.find(route => route.name === 'accounts')
    expect(routerRouteAccountsRoute!.depth).toBe(1)

    const routerRouteNewAccountRoute = response.find(route => route.name === 'new-account')
    expect(routerRouteNewAccountRoute!.depth).toBe(2)

    const routerRouteAccountRoute = response.find(route => route.name === 'account')
    expect(routerRouteAccountRoute!.depth).toBe(2)

    const routerRouteEditAccountRoute = response.find(route => route.name === 'edit-account')
    expect(routerRouteEditAccountRoute!.depth).toBe(3)
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

      const [child, parent, grandparent] = createRouterRoutes([grandparentRoute, unrelatedRoute])

      expect(grandparent.matches).toMatchObject([grandparentRoute])
      expect(parent.matches).toMatchObject([grandparentRoute, parentRoute])
      expect(child.matches).toMatchObject([grandparentRoute, parentRoute, childRoute])
    })
  })
})