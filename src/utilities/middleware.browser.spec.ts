import { expect, test, vi } from 'vitest'
import { RouteMiddleware } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { Route } from '@/types/routes'
import { RouterRoute } from '@/utilities/createRouterRoute'
import { createRouterRouteQuery } from '@/utilities/createRouterRouteQuery'
import { executeMiddleware } from '@/utilities/middleware'
import { component } from '@/utilities/testHelpers'

test('calls middleware with correct routes', () => {
  const middleware = vi.fn()

  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component,
    middleware,
  } as const satisfies Route

  const routerRouteA: RouterRoute = {
    matched: routeA,
    matches: [routeA],
    name: routeA.name,
    query: createRouterRouteQuery(),
    params: {},
  }

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  } as const satisfies Route

  const routerRouteB: RouterRoute = {
    matched: routeB,
    matches: [routeB],
    name: routeB.name,
    query: createRouterRouteQuery(),
    params: {},
  }

  executeMiddleware({ to: routerRouteA, from: routerRouteB })

  expect(middleware).toHaveBeenCalledOnce()

  const [to, { from }] = middleware.mock.lastCall
  expect(to).toMatchObject(routerRouteA!)
  expect(from).toMatchObject(routerRouteB!)
})

test.each<{ type: string, error: any, middleware: RouteMiddleware }>([
  { type: 'reject', error: RouterRejectionError, middleware: (_to, { reject }) => reject('NotFound') },
  { type: 'push', error: RouterPushError, middleware: (_to, { push }) => push('') },
  { type: 'replace', error: RouterReplaceError, middleware: (_to, { replace }) => replace('') },
])('throws exception when $type is called', async ({ error, middleware }) => {
  const route = {
    name: 'routeA',
    path: '/routeA',
    component,
    middleware,
  } as const satisfies Route

  const routerRoute: RouterRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    query: createRouterRouteQuery(),
    params: {},
  }

  const execute = (): Promise<void> => executeMiddleware({ to: routerRoute, from: null })

  await expect(() => execute()).rejects.toThrowError(error)
})

test('middleware is called in order', () => {
  const middlewareA = vi.fn()
  const middlewareB = vi.fn()
  const middlewareC = vi.fn()

  const route = {
    name: 'routeA',
    path: '/routeA',
    component,
    middleware: [middlewareA, middlewareB, middlewareC],
  } as const satisfies Route

  const routerRoute: RouterRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    query: createRouterRouteQuery(),
    params: {},
  }

  executeMiddleware({ to: routerRoute, from: null })
  const [orderA] = middlewareA.mock.invocationCallOrder
  const [orderB] = middlewareB.mock.invocationCallOrder
  const [orderC] = middlewareC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})