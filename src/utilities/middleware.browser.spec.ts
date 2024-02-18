import { expect, test, vi } from 'vitest'
import { RouteMiddleware } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { Route } from '@/types/routes'
import { executeMiddleware } from '@/utilities/middleware'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { getRouterRouteForUrl } from '@/utilities/routes'
import { component } from '@/utilities/testHelpers'

test('calls middleware with correct routes', () => {
  const middleware = vi.fn()
  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component,
    middleware,
  } as const satisfies Route

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  } as const satisfies Route

  const resolved = resolveRoutes([routeA, routeB])
  const routerRouteA = getRouterRouteForUrl(resolved, routeA.path)!
  const routerRouteB = getRouterRouteForUrl(resolved, routeB.path)!

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
  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component,
    middleware,
  } as const satisfies Route

  const resolved = resolveRoutes([routeA])
  const routerRouteA = getRouterRouteForUrl(resolved, routeA.path)!
  const execute = (): Promise<void> => executeMiddleware({ to: routerRouteA, from: null })

  await expect(() => execute()).rejects.toThrowError(error)
})

test('middleware is called in order', () => {
  const middlewareA = vi.fn()
  const middlewareB = vi.fn()
  const middlewareC = vi.fn()
  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component,
    middleware: [middlewareA, middlewareB, middlewareC],
  } as const satisfies Route

  const resolved = resolveRoutes([routeA])
  const routerRouteA = getRouterRouteForUrl(resolved, routeA.path)!

  executeMiddleware({ to: routerRouteA, from: null })
  const [orderA] = middlewareA.mock.invocationCallOrder
  const [orderB] = middlewareB.mock.invocationCallOrder
  const [orderC] = middlewareC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})