import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterHooks } from '@/services/createRouterHooks'
import { createRouteHooks } from '@/services/createRouteHooks'
import { createHook } from '@/services/createHook'
import { createRejection } from '@/services/createRejection'
import { HookRemove } from '@/types/hooks'

const lifecycles = [
  'onBeforeRouteEnter',
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
  'onAfterRouteEnter',
  'onAfterRouteUpdate',
  'onAfterRouteLeave',
] as const

test.each(lifecycles)('%s can remove itself for every registration scope', async (lifecycle) => {
  for (const scope of ['route', 'global', 'component', 'plugin'] as const) {
    if (scope === 'component' && lifecycle === 'onBeforeRouteEnter') {
      continue
    }

    const route = createRoute({ name: 'target', path: '/target' })
    const resolved = createResolvedRoute(route)
    const runner = createRouterHooks({ redirectStatus: 302 })
    const callback = vi.fn((_to, { remove }: { remove: HookRemove }) => {
      remove()
    })
    const control = vi.fn()

    if (scope === 'route') {
      route[lifecycle](callback)
      route[lifecycle](control)
    }

    if (scope === 'global') {
      runner[lifecycle](callback)
      runner[lifecycle](control)
    }

    if (scope === 'component') {
      runner.addComponentHook({ lifecycle, depth: 0, hook: callback })
      runner.addComponentHook({ lifecycle, depth: 0, hook: control })
    }

    if (scope === 'plugin') {
      const plugin = createRouteHooks()
      plugin[lifecycle](callback)
      plugin[lifecycle](control)
      runner.addGlobalRouteHooks([plugin.store])
    }

    const context = {
      to: lifecycle.endsWith('Leave') ? null : resolved,
      from: lifecycle.endsWith('Enter') ? null : resolved,
      signal: new AbortController().signal,
    }
    const run = lifecycle.startsWith('onBefore') ? runner.runBeforeRouteHooks : runner.runAfterRouteHooks

    await run(context)
    await run(context)

    expect(callback, scope).toHaveBeenCalledTimes(1)
    expect(control, scope).toHaveBeenCalledTimes(2)
  }
})

test('removing a reusable hook leaves other routes and lifecycles registered', async () => {
  const first = createRoute({ name: 'first', path: '/first' })
  const second = createRoute({ name: 'second', path: '/second' })
  const callback = vi.fn((_to, { remove }: { remove: HookRemove }) => {
    remove()
  })
  const hook = createHook({ hook: callback })
  first.onBeforeRouteEnter(hook)
  first.onAfterRouteEnter(hook)
  second.onBeforeRouteEnter(hook)
  const runner = createRouterHooks({ redirectStatus: 302 })
  const context = { to: createResolvedRoute(first), from: null, signal: new AbortController().signal }

  await runner.runBeforeRouteHooks(context)
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(1)
  await runner.runAfterRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(2)
  await runner.runBeforeRouteHooks({ ...context, to: createResolvedRoute(second) })
  expect(callback).toHaveBeenCalledTimes(3)
})

test('each invocation removes only its own global or route registration', async () => {
  const parent = createRoute({ path: '/parent' })
  const child = createRoute({ parent, name: 'child', path: '/child' })
  const removals: HookRemove[] = []
  const callback = vi.fn((_to, { remove }: { remove: HookRemove }) => {
    removals.push(remove)
  })
  parent.onBeforeRouteEnter(callback)
  child.onBeforeRouteEnter(callback)
  const runner = createRouterHooks({ redirectStatus: 302 })
  runner.onBeforeRouteEnter(callback)
  const context = { to: createResolvedRoute(child), from: null, signal: new AbortController().signal }

  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(3)
  removals[1]()
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(5)
  await runner.runBeforeRouteHooks({ ...context, to: createResolvedRoute(parent) })
  expect(callback).toHaveBeenCalledTimes(6)
  removals[0]()
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(7)
  removals[2]()
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(7)
})

test.each(lifecycles)('%s self-removal preserves separate registrations', async (lifecycle) => {
  const parent = createRoute({ path: '/parent' })
  const child = createRoute({ parent, name: 'child', path: '/child' })
  const callback = vi.fn((_to, { remove }: { remove: HookRemove }) => {
    remove()
  })
  parent[lifecycle](callback)
  child[lifecycle](callback)
  const runner = createRouterHooks({ redirectStatus: 302 })
  runner[lifecycle](callback)
  const resolved = createResolvedRoute(child)
  const context = {
    to: lifecycle.endsWith('Leave') ? null : resolved,
    from: lifecycle.endsWith('Enter') ? null : resolved,
    signal: new AbortController().signal,
  }
  const run = lifecycle.startsWith('onBefore') ? runner.runBeforeRouteHooks : runner.runAfterRouteHooks

  await run(context)
  await run(context)
  expect(callback).toHaveBeenCalledTimes(3)
})

test('self-removal detaches the registration signal', async () => {
  const route = createRoute({ name: 'target', path: '/target' })
  const controller = new AbortController()
  const callback = vi.fn((_to, { remove }: { remove: HookRemove }) => {
    remove()
  })
  route.onBeforeRouteEnter(callback, { signal: controller.signal })
  const runner = createRouterHooks({ redirectStatus: 302 })
  const context = { to: createResolvedRoute(route), from: null, signal: new AbortController().signal }

  await runner.runBeforeRouteHooks(context)
  route.onBeforeRouteEnter(callback)
  controller.abort()
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(2)
})

test('duplicate callbacks on one route remove their own registrations', async () => {
  const route = createRoute({ name: 'target', path: '/target' })
  const callback = vi.fn((_to, { remove }: { remove: HookRemove }) => {
    remove()
  })
  route.onBeforeRouteEnter(callback)
  route.onBeforeRouteEnter(callback)
  const runner = createRouterHooks({ redirectStatus: 302 })
  const context = { to: createResolvedRoute(route), from: null, signal: new AbortController().signal }

  await runner.runBeforeRouteHooks(context)
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(2)
})

test('error hooks can remove themselves', () => {
  const runner = createRouterHooks({ redirectStatus: 302 })
  const callback = vi.fn((_error, { remove }: { remove: HookRemove }) => {
    remove()
  })
  runner.onError(callback)
  const context = { to: null, from: null, source: 'hook' as const }

  runner.runErrorHooks(new Error('first'), context)
  runner.runErrorHooks(new Error('second'), context)
  expect(callback).toHaveBeenCalledTimes(1)
})

test('global and rejection hooks can remove themselves independently', () => {
  const rejection = createRejection({ type: 'Denied' })
  const runner = createRouterHooks({ redirectStatus: 302 })
  const callback = vi.fn((_type, { remove }: { remove: HookRemove }) => {
    remove()
  })
  runner.onRejection(callback)
  rejection.onRejection(callback)

  runner.runRejectionHooks(rejection, { to: null, from: null })
  runner.runRejectionHooks(rejection, { to: null, from: null })
  expect(callback).toHaveBeenCalledTimes(2)
})
