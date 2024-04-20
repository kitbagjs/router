import { expect, test, vi } from 'vitest'
import { BeforeRouteHook } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
import { createRouterHooks } from '@/utilities/createRouterHooks'
import { createRouteHookRunners } from '@/utilities/hooks'
import { component } from '@/utilities/testHelpers'

test('calls hook with correct routes', () => {
  const hook = vi.fn()
  const { hooks } = createRouterHooks()
  const { runBeforeRouteHooks } = createRouteHookRunners()

  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component,
    onBeforeRouteEnter: hook,
  }

  const resolvedRouteA: ResolvedRoute = {
    matched: routeA,
    matches: [routeA],
    key: routeA.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  }

  const resolvedRouteB: ResolvedRoute = {
    matched: routeB,
    matches: [routeB],
    key: routeB.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  runBeforeRouteHooks({
    hooks,
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
  { type: 'push', status: 'PUSH', hook: (_to, { push }) => push('/') },
  { type: 'replace', status: 'PUSH', hook: (_to, { replace }) => replace('/') },
  { type: 'abort', status: 'ABORT', hook: (_to, { abort }) => abort() },
])('Returns correct status when hook is called', async ({ status, hook }) => {
  const { runBeforeRouteHooks } = createRouteHookRunners()
  const { hooks } = createRouterHooks()
  const route = {
    name: 'routeA',
    path: '/routeA',
    component,
    onBeforeRouteEnter: hook,
  }

  const resolvedRoute: ResolvedRoute = {
    matched: route,
    matches: [route],
    key: route.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  }

  const resolvedRouteB: ResolvedRoute = {
    matched: routeB,
    matches: [routeB],
    key: routeB.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const response = await runBeforeRouteHooks({
    to: resolvedRoute,
    from: resolvedRouteB,
    hooks,
  })

  await expect(response.status).toBe(status)
})

test('hook is called in order', async () => {
  const hookA = vi.fn()
  const hookB = vi.fn()
  const hookC = vi.fn()
  const { hooks } = createRouterHooks()
  const { runBeforeRouteHooks } = createRouteHookRunners()

  const route = {
    name: 'routeA',
    path: '/routeA',
    component,
    onBeforeRouteEnter: [hookA, hookB, hookC],
  }

  const resolvedRoute: ResolvedRoute = {
    matched: route,
    matches: [route],
    key: route.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  }

  const resolvedRouteB: ResolvedRoute = {
    matched: routeB,
    matches: [routeB],
    key: routeB.name,
    query: createResolvedRouteQuery(),
    params: {},
  }

  await runBeforeRouteHooks({
    hooks,
    to: resolvedRoute,
    from: resolvedRouteB,
  })

  const [orderA] = hookA.mock.invocationCallOrder
  const [orderB] = hookB.mock.invocationCallOrder
  const [orderC] = hookC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})