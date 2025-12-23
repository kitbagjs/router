import { expect, test, vi } from 'vitest'
import { createRouterHooks } from '@/services/createRouterHooks'
import { BeforeRouteHook } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'

test('calls hook with correct routes', () => {
  const hook = vi.fn()
  const { runBeforeRouteHooks } = createRouterHooks()

  const toRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeA',
    component,
  })

  toRoute.onBeforeRouteEnter(hook)

  const fromRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeB',
    component,
  })

  const to = createResolvedRoute(toRoute, {})
  const from = createResolvedRoute(fromRoute, {})

  runBeforeRouteHooks({
    to,
    from,
  })

  expect(hook).toHaveBeenCalledOnce()
})

test.each<{ type: string, status: string, hook: BeforeRouteHook }>([
  {
    type: 'reject',
    status: 'REJECT',
    hook: (_to, { reject }) => {
      reject('NotFound')
    },
  },
  { type: 'push', status: 'PUSH', hook: (_to, { push }) => push('/') },
  { type: 'replace', status: 'PUSH', hook: (_to, { replace }) => replace('/') },
  {
    type: 'abort',
    status: 'ABORT',
    hook: (_to, { abort }) => {
      abort()
    },
  },
])('Returns correct status when hook is called', async ({ status, hook }) => {
  const { runBeforeRouteHooks } = createRouterHooks()

  const toRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeA',
    component,
  })

  toRoute.onBeforeRouteEnter(hook)

  const fromRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeB',
    component,
  })

  fromRoute.onBeforeRouteEnter(hook)

  const to = createResolvedRoute(toRoute, {})
  const from = createResolvedRoute(fromRoute, {})

  const response = await runBeforeRouteHooks({
    to,
    from,
  })

  expect(response.status).toBe(status)
})

test('hook is called in order', async () => {
  const hookA = vi.fn()
  const hookB = vi.fn()
  const hookC = vi.fn()
  const { runBeforeRouteHooks } = createRouterHooks()

  const toRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeA',
    component,
  })

  toRoute.onBeforeRouteEnter(hookA)
  toRoute.onBeforeRouteEnter(hookB)
  toRoute.onBeforeRouteEnter(hookC)

  const fromRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeB',
    component,
  })

  const to = createResolvedRoute(toRoute, {})
  const from = createResolvedRoute(fromRoute, {})

  await runBeforeRouteHooks({
    to,
    from,
  })

  const [orderA] = hookA.mock.invocationCallOrder
  const [orderB] = hookB.mock.invocationCallOrder
  const [orderC] = hookC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})

test('multiple onError callbacks run in order', () => {
  const errorHook1 = vi.fn((error) => {
    throw error
  })
  const errorHook2 = vi.fn()
  const errorHook3 = vi.fn()

  const { runErrorHooks, onError } = createRouterHooks()

  onError(errorHook1)
  onError(errorHook2)
  onError(errorHook3)

  const testError = new Error('Test error')
  const toRoute = createRoute({
    name: 'routeA',
    component,
    href: '/',
    hash: '',
  })

  const to = createResolvedRoute(toRoute, {})
  const from: ResolvedRoute | null = null

  runErrorHooks(testError, { to, from, source: 'hook' })

  expect(errorHook1).toHaveBeenCalledOnce()
  expect(errorHook2).toHaveBeenCalledOnce()
  expect(errorHook3).not.toHaveBeenCalled()

  const [order1] = errorHook1.mock.invocationCallOrder
  const [order2] = errorHook2.mock.invocationCallOrder

  expect(order1).toBeLessThan(order2)
})

test('when onError callback calls reject, other onError callbacks do not run', () => {
  const errorHook1 = vi.fn((_error, { reject }) => {
    reject('NotFound')
    return true
  })
  const errorHook2 = vi.fn(() => false)
  const errorHook3 = vi.fn(() => false)
  const { runErrorHooks, onError } = createRouterHooks()

  onError(errorHook1)
  onError(errorHook2)
  onError(errorHook3)

  const testError = new Error('Test error')
  const toRoute = createRoute({
    name: 'routeA',
    component,
    href: '/',
    hash: '',
  })

  const to = createResolvedRoute(toRoute, {})
  const from: ResolvedRoute | null = null

  expect(() => {
    runErrorHooks(testError, { to, from, source: 'hook' })
  }).toThrow()

  expect(errorHook1).toHaveBeenCalledOnce()
  expect(errorHook2).not.toHaveBeenCalled()
  expect(errorHook3).not.toHaveBeenCalled()
})

test('when onError callback calls push, other onError callbacks do not run', () => {
  const errorHook1 = vi.fn((_error, { push }) => {
    push('/other')
    return true
  })
  const errorHook2 = vi.fn(() => false)
  const errorHook3 = vi.fn(() => false)
  const { runErrorHooks, onError } = createRouterHooks()

  onError(errorHook1)
  onError(errorHook2)
  onError(errorHook3)

  const testError = new Error('Test error')
  const toRoute = createRoute({
    id: Math.random().toString(),
    name: 'routeA',
    component,
    href: '/',
    hash: '',
  })

  const to = createResolvedRoute(toRoute, {})
  const from: ResolvedRoute | null = null

  expect(() => {
    runErrorHooks(testError, { to, from, source: 'hook' })
  }).toThrow()

  expect(errorHook1).toHaveBeenCalledOnce()
  expect(errorHook2).not.toHaveBeenCalled()
  expect(errorHook3).not.toHaveBeenCalled()
})

test('when onError callback calls replace, other onError callbacks do not run', () => {
  const errorHook1 = vi.fn((_error, { replace }) => {
    replace('/other')
    return true
  })
  const errorHook2 = vi.fn(() => false)
  const errorHook3 = vi.fn(() => false)
  const { runErrorHooks, onError } = createRouterHooks()

  onError(errorHook1)
  onError(errorHook2)
  onError(errorHook3)

  const testError = new Error('Test error')
  const toRoute = createRoute({
    name: 'routeA',
    component,
    href: '/',
    hash: '',
  })

  const to = createResolvedRoute(toRoute, {})
  const from: ResolvedRoute | null = null

  expect(() => {
    runErrorHooks(testError, { to, from, source: 'hook' })
  }).toThrow()

  expect(errorHook1).toHaveBeenCalledOnce()
  expect(errorHook2).not.toHaveBeenCalled()
  expect(errorHook3).not.toHaveBeenCalled()
})
