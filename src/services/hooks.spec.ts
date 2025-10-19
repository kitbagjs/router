import { expect, test, vi } from 'vitest'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { createRouterHooks } from '@/services/createRouterHooks'
import { BeforeRouteHook } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'
import { Router } from '@/types/router'
import { InjectionKey } from 'vue'

test('calls hook with correct routes', () => {
  const hook = vi.fn()
  const { runBeforeRouteHooks } = createRouterHooks(Symbol() as InjectionKey<Router>)

  const toOptions = {
    id: Math.random().toString(),
    name: 'routeA',
    component,
    onBeforeRouteEnter: hook,
    meta: {},
    state: {},
  }

  const toRoute: ResolvedRoute = {
    id: toOptions.id,
    matched: toOptions,
    matches: [toOptions],
    name: toOptions.name,
    query: createResolvedRouteQuery(),
    params: {},
    state: {},
    href: '/',
    hash: '',
  }

  const fromOptions = {
    id: Math.random().toString(),
    name: 'routeB',
    component,
    meta: {},
    state: {},
  }

  const fromRoute: ResolvedRoute = {
    id: fromOptions.id,
    matched: fromOptions,
    matches: [fromOptions],
    name: fromOptions.name,
    query: createResolvedRouteQuery(),
    params: {},
    state: {},
    href: '/',
    hash: '',
  }

  runBeforeRouteHooks({
    to: toRoute,
    from: fromRoute,
  })

  expect(hook).toHaveBeenCalledOnce()

  const [to, { from }] = hook.mock.lastCall ?? []
  expect(to).toMatchObject(toRoute)
  expect(from).toMatchObject(fromRoute)
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
  const { runBeforeRouteHooks } = createRouterHooks(Symbol() as InjectionKey<Router>)

  const toOptions = {
    id: Math.random().toString(),
    name: 'routeA',
    component,
    onBeforeRouteEnter: hook,
    meta: {},
    state: {},
  }

  const to: ResolvedRoute = {
    id: toOptions.id,
    matched: toOptions,
    matches: [toOptions],
    name: toOptions.name,
    query: createResolvedRouteQuery(),
    params: {},
    state: {},
    href: '/',
    hash: '',
  }

  const fromOptions = {
    id: Math.random().toString(),
    name: 'routeB',
    component,
    meta: {},
    state: {},
  }

  const from: ResolvedRoute = {
    id: fromOptions.id,
    matched: fromOptions,
    matches: [fromOptions],
    name: fromOptions.name,
    query: createResolvedRouteQuery(),
    params: {},
    state: {},
    href: '/',
    hash: '',
  }

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
  const { runBeforeRouteHooks } = createRouterHooks(Symbol() as InjectionKey<Router>)

  const toOptions = {
    id: Math.random().toString(),
    name: 'routeA',
    component,
    onBeforeRouteEnter: [hookA, hookB, hookC],
    meta: {},
    state: {},
  }

  const to: ResolvedRoute = {
    id: toOptions.id,
    matched: toOptions,
    matches: [toOptions],
    name: toOptions.name,
    query: createResolvedRouteQuery(),
    params: {},
    state: {},
    href: '/',
    hash: '',
  }

  const fromOptions = {
    id: Math.random().toString(),
    name: 'routeB',
    component,
    meta: {},
    state: {},
  }

  const from: ResolvedRoute = {
    id: fromOptions.id,
    matched: fromOptions,
    matches: [fromOptions],
    name: fromOptions.name,
    query: createResolvedRouteQuery(),
    params: {},
    state: {},
    href: '/',
    hash: '',
  }

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
