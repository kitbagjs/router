import { expect, test, vi } from 'vitest'
import { BeforeRouteHook } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/routes'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
import { runBeforeRouteHooks } from '@/utilities/hooks'
import { component } from '@/utilities/testHelpers'

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

  runBeforeRouteHooks({
    hooks: [hook],
    to: resolvedRouteA,
    from: resolvedRouteB,
  })

  expect(hook).toHaveBeenCalledOnce()

  const [to, { from }] = hook.mock.lastCall
  expect(to).toMatchObject(resolvedRouteA)
  expect(from).toMatchObject(resolvedRouteB)
})

test.each<{ type: string, status: string, hook: BeforeRouteHook }>([
  { type: 'reject', status: 'REJECT', hook: (_to, { reject }) => reject('NotFound') },
  { type: 'push', status: 'PUSH', hook: (_to, { push }) => push('') },
  { type: 'replace', status: 'PUSH', hook: (_to, { replace }) => replace('') },
  { type: 'abort', status: 'ABORT', hook: (_to, { abort }) => abort() },
])('throws exception when $type is called', async ({ status, hook }) => {
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

  const response = await runBeforeRouteHooks({
    hooks: [hook],
    to: resolvedRoute,
    from: resolvedRoute,
  })

  await expect(response.status).toBe(status)
})

test('hook is called in order', async () => {
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

  await runBeforeRouteHooks({
    hooks: [hookA, hookB, hookC],
    to: resolvedRoute,
    from: resolvedRoute,
  })

  const [orderA] = hookA.mock.invocationCallOrder
  const [orderB] = hookB.mock.invocationCallOrder
  const [orderC] = hookC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})