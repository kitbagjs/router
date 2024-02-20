import { expect, test, vi } from 'vitest'
import { RouteMiddleware } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/routes'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
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

  const resolvedRouteA: ResolvedRoute = {
    matched: routeA,
    matches: [routeA],
    name: routeA.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  } as const satisfies Route

  const resolvedRouteB: ResolvedRoute = {
    matched: routeB,
    matches: [routeB],
    name: routeB.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  executeMiddleware({ to: resolvedRouteA, from: resolvedRouteB })

  expect(middleware).toHaveBeenCalledOnce()

  const [to, { from }] = middleware.mock.lastCall
  expect(to).toMatchObject(resolvedRouteA)
  expect(from).toMatchObject(resolvedRouteB)
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

  const resolvedRoute: ResolvedRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const execute = (): Promise<void> => executeMiddleware({ to: resolvedRoute, from: null })

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

  const resolvedRoute: ResolvedRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  executeMiddleware({ to: resolvedRoute, from: null })
  const [orderA] = middlewareA.mock.invocationCallOrder
  const [orderB] = middlewareB.mock.invocationCallOrder
  const [orderC] = middlewareC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})