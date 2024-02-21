import { expect, test, vi } from 'vitest'
import { RouteHook } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/routes'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
import { executeRouteHooks } from '@/utilities/hooks'
import { component } from '@/utilities/testHelpers'

const rethrow = (error: unknown): void => {
  throw error
}

test('calls hook with correct routes', () => {
  const hook = vi.fn()

  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component,
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

  executeRouteHooks({
    hooks: [hook],
    to: resolvedRouteA,
    from: resolvedRouteB,
    onRouteHookError: rethrow,
  })

  expect(hook).toHaveBeenCalledOnce()

  const [to, { from }] = hook.mock.lastCall
  expect(to).toMatchObject(resolvedRouteA)
  expect(from).toMatchObject(resolvedRouteB)
})

test.each<{ type: string, error: any, hook: RouteHook }>([
  { type: 'reject', error: RouterRejectionError, hook: (_to, { reject }) => reject('NotFound') },
  { type: 'push', error: RouterPushError, hook: (_to, { push }) => push('') },
  { type: 'replace', error: RouterReplaceError, hook: (_to, { replace }) => replace('') },
])('throws exception when $type is called', async ({ error, hook }) => {
  const route = {
    name: 'routeA',
    path: '/routeA',
    component,
  } as const satisfies Route

  const resolvedRoute: ResolvedRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const execute = (): Promise<boolean> => executeRouteHooks({
    hooks: [hook],
    to: resolvedRoute,
    from: null,
    onRouteHookError: rethrow,
  })

  await expect(() => execute()).rejects.toThrowError(error)
})

test('hook is called in order', () => {
  const hookA = vi.fn()
  const hookB = vi.fn()
  const hookC = vi.fn()

  const route = {
    name: 'routeA',
    path: '/routeA',
    component,
  } as const satisfies Route

  const resolvedRoute: ResolvedRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  executeRouteHooks({
    hooks: [hookA, hookB, hookC],
    to: resolvedRoute,
    from: null,
    onRouteHookError: rethrow,
  })

  const [orderA] = hookA.mock.invocationCallOrder
  const [orderB] = hookB.mock.invocationCallOrder
  const [orderC] = hookC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})