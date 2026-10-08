import { createRoutePage, createRejectionPage } from '@/services/createPage'
import { createComponentsStore } from '@/services/createComponentsStore'
import { createRouteValueStore } from '@/services/createRouteValueStore'
import { createNavigationProgress } from '@/services/createNavigationProgress'
import { createRejection } from '@/services/createRejection'
import { isRejection } from '@/types/rejection'
import { Page } from '@/types/page'
import { expect, test, vi } from 'vitest'
import { createRouterHooks } from '@/services/createRouterHooks'
import { BeforeEnterHook } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'

const { signal } = new AbortController()

test('calls hook with correct routes', () => {
  const hook = vi.fn()
  const { runBeforeHooks } = createRouterHooks({ redirectStatus: 302 })

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

  runBeforeHooks({ to: page(to), from: page(from), signal, progress: progress() })

  expect(hook).toHaveBeenCalledOnce()
})

test.each<{ type: string, status: string, hook: BeforeEnterHook }>([
  {
    type: 'reject',
    status: 'REJECT',
    hook: (_to, { reject }) => {
      reject('NotFound')
    },
  },
  { type: 'push', status: 'PUSH', hook: (_to, { push }) => push('/') },
  { type: 'replace', status: 'PUSH', hook: (_to, { replace }) => replace('/') },
  { type: 'update', status: 'PUSH', hook: (_to, { update }) => update('paramName', 'value') },
  {
    type: 'abort',
    status: 'ABORT',
    hook: (_to, { abort }) => {
      abort()
    },
  },
])('Returns correct status when hook is called', async ({ status, hook }) => {
  const { runBeforeHooks } = createRouterHooks({ redirectStatus: 302 })

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

  const response = await runBeforeHooks({ to: page(to), from: page(from), signal, progress: progress() })

  expect(response.status).toBe(status)
})

test('hook is called in order', async () => {
  const hookA = vi.fn()
  const hookB = vi.fn()
  const hookC = vi.fn()
  const { runBeforeHooks } = createRouterHooks({ redirectStatus: 302 })

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

  await runBeforeHooks({ to: page(to), from: page(from), signal, progress: progress() })

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

  const { runErrorHooks, onError } = createRouterHooks({ redirectStatus: 302 })

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
  const { runErrorHooks, onError } = createRouterHooks({ redirectStatus: 302 })

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
  })
  const errorHook2 = vi.fn()
  const errorHook3 = vi.fn()
  const { runErrorHooks, onError } = createRouterHooks({ redirectStatus: 302 })

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
  })
  const errorHook2 = vi.fn()
  const errorHook3 = vi.fn()
  const { runErrorHooks, onError } = createRouterHooks({ redirectStatus: 302 })

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

test('when entering a rejection, only route leave hooks are called', async () => {
  const calls: string[] = []
  const { runBeforeHooks, ...hooks } = createRouterHooks({ redirectStatus: 302 })

  hooks.onBeforeRouteEnter(() => {
    calls.push('enter')
  })
  hooks.onBeforeRouteUpdate(() => {
    calls.push('update')
  })
  hooks.onBeforeRouteLeave(() => {
    calls.push('leave')
  })

  const fromRoute = createRoute({ name: 'routeA', component })
  const from = createResolvedRoute(fromRoute, {})

  await runBeforeHooks({ to: page(), from: page(from), signal, progress: progress() })

  expect(calls).toEqual(['leave'])
})

function page(route?: ResolvedRoute): Page {
  if (route) {
    return createRoutePage(route, { components: createComponentsStore(Symbol()), values: createRouteValueStore(), redirectStatus: 302 })
  }

  const rejection = createRejection({ type: 'NotFound' })

  if (!isRejection(rejection)) {
    throw new Error('Expected a rejection')
  }

  return createRejectionPage(rejection, {}, 404)
}

function progress(): ReturnType<ReturnType<typeof createNavigationProgress>['begin']> {
  return createNavigationProgress().begin({ to: null, from: null, expected: 0 })
}

test('component route update hooks do not run between rejection pages', async () => {
  const hook = vi.fn()
  const hooks = createRouterHooks({ redirectStatus: 302 })

  hooks.addComponentHook({ lifecycle: 'onBeforeRouteUpdate', depth: 0, hook })
  hooks.addComponentHook({ lifecycle: 'onAfterRouteUpdate', depth: 0, hook })

  const navigation = { to: page(), from: page(), signal, progress: progress() }

  await hooks.runBeforeHooks(navigation)
  await hooks.runAfterHooks(navigation)

  expect(hook).not.toHaveBeenCalled()
})
