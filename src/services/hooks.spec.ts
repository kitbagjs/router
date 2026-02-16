import { describe, expect, test, vi } from 'vitest'
import { createRouterHooks } from '@/services/createRouterHooks'
import { BeforeEnterHook } from '@/types/hooks'
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

  runBeforeRouteHooks({ to, from })

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

  const response = await runBeforeRouteHooks({ to, from })

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

  await runBeforeRouteHooks({ to, from })

  const [orderA] = hookA.mock.invocationCallOrder
  const [orderB] = hookB.mock.invocationCallOrder
  const [orderC] = hookC.mock.invocationCallOrder

  expect(orderA).toBeLessThan(orderB)
  expect(orderB).toBeLessThan(orderC)
})

describe('onError hook', () => {
  test('multiple callbacks run in order', () => {
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

  test('when callback calls reject, other onError callbacks do not run', () => {
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

  test('when callback calls push, other onError callbacks do not run', () => {
    const errorHook1 = vi.fn((_error, { push }) => {
      push('/other')
    })
    const errorHook2 = vi.fn()
    const errorHook3 = vi.fn()
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

  test('when callback calls replace, other onError callbacks do not run', () => {
    const errorHook1 = vi.fn((_error, { replace }) => {
      replace('/other')
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

    expect(() => {
      runErrorHooks(testError, { to, from, source: 'hook' })
    }).toThrow()

    expect(errorHook1).toHaveBeenCalledOnce()
    expect(errorHook2).not.toHaveBeenCalled()
    expect(errorHook3).not.toHaveBeenCalled()
  })
})

describe('setTitle hook', () => {
  test('setTitle hook is called with correct context', async () => {
    const { runTitleHooks } = createRouterHooks()

    const toRouteSetTitle = vi.fn()
    const toRoute = createRoute({
      name: 'routeA',
      component,
    })

    toRoute.setTitle(toRouteSetTitle)
    const to = createResolvedRoute(toRoute, {})

    await runTitleHooks({ to, from: null })

    expect(toRouteSetTitle).toHaveBeenCalledOnce()
  })

  test('setTitle hook is called in order', async () => {
    const { runTitleHooks, setTitle } = createRouterHooks()

    const globalSetTitle = vi.fn()

    setTitle(globalSetTitle)

    const parentRouteSetTitle = vi.fn()
    const parentRoute = createRoute({
      name: 'parentA',
      component,
    })
    parentRoute.setTitle(parentRouteSetTitle)

    const childRouteSetTitle = vi.fn()
    const childRoute = createRoute({
      name: 'childA',
      component,
      parent: parentRoute,
    })
    childRoute.setTitle(childRouteSetTitle)

    const fromRouteSetTitle = vi.fn()
    const fromRoute = createRoute({
      name: 'fromA',
      component,
      parent: parentRoute,
    })
    fromRoute.setTitle(fromRouteSetTitle)

    const to = createResolvedRoute(childRoute, {})
    const from = createResolvedRoute(fromRoute, {})

    await runTitleHooks({ to, from })

    const [orderParent] = parentRouteSetTitle.mock.invocationCallOrder
    const [orderChild] = childRouteSetTitle.mock.invocationCallOrder

    expect(orderParent).toBeLessThan(orderChild)
    expect(fromRouteSetTitle).not.toHaveBeenCalled()
  })

  test('setTitle hook updates the document title', async () => {
    const { runTitleHooks, setTitle } = createRouterHooks()

    setTitle(() => 'global')

    const fromRoute = createRoute({
      name: 'fromA',
      component,
    })

    const parentRoute = createRoute({
      name: 'parentA',
      component,
    })
    parentRoute.setTitle((to, { title }) => [to.name, title].filter(Boolean).join('<'))

    const toRoute = createRoute({
      parent: parentRoute,
      name: 'routeA',
      query: { foo: Number },
      component,
    })
    toRoute.setTitle((to, { from, title }) => {
      return [to.name, to.params.foo, from?.name, title].filter(Boolean).join('<')
    })

    const to = createResolvedRoute(toRoute, { foo: 42 })
    const from = createResolvedRoute(fromRoute, {})

    const title = await runTitleHooks({ to, from })

    expect(title).toBe('routeA<42<fromA<parentA<global')
  })
})
