import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterHooks } from '@/services/createRouterHooks'
import { createRouteHooks } from '@/services/createRouteHooks'
import { createHook } from '@/services/createHook'

test.each([
  'onBeforeRouteEnter',
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
  'onAfterRouteEnter',
  'onAfterRouteUpdate',
  'onAfterRouteLeave',
] as const)('%s runs once for each matching registration', async (lifecycle) => {
  const parent = createRoute({ name: 'parent', path: '/parent' })
  const child = createRoute({ parent, name: 'child', path: '/child' })
  const callback = vi.fn()
  const runner = createRouterHooks({ redirectStatus: 302 })
  parent[lifecycle](callback)
  child[lifecycle](callback)
  runner[lifecycle](callback)
  const run = lifecycle.startsWith('onBefore') ? runner.runBeforeRouteHooks : runner.runAfterRouteHooks

  for (const [route, count] of [[child, 3], [parent, 2]] as const) {
    callback.mockClear()
    const resolved = createResolvedRoute(route)

    await run({
      to: lifecycle.endsWith('Leave') ? null : resolved,
      from: lifecycle.endsWith('Enter') ? null : resolved,
      signal: new AbortController().signal,
    })
    expect(callback).toHaveBeenCalledTimes(count)
  }
})

test('one inherited registration runs once and removal leaves another store registered', async () => {
  const parent = createRoute({ name: 'parent', path: '/parent' })
  const child = createRoute({ parent, name: 'child', path: '/child' })
  const callback = vi.fn()
  const removeParent = parent.onBeforeRouteEnter(callback)
  const runner = createRouterHooks({ redirectStatus: 302 })
  const context = { to: createResolvedRoute(child), from: null, signal: new AbortController().signal }

  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(1)

  child.onBeforeRouteEnter(callback)
  removeParent()
  await runner.runBeforeRouteHooks(context)
  expect(callback).toHaveBeenCalledTimes(2)
})

test('separate global stores retain registrations without repeating them for each route depth', async () => {
  const parent = createRoute({ path: '/parent' })
  const child = createRoute({ parent, name: 'child', path: '/child' })
  const callback = vi.fn()
  const runner = createRouterHooks({ redirectStatus: 302 })
  const plugin = createRouteHooks()
  plugin.onBeforeRouteEnter(callback)
  runner.addGlobalRouteHooks([plugin.store])
  runner.onBeforeRouteEnter(callback)

  await runner.runBeforeRouteHooks({ to: createResolvedRoute(child), from: null, signal: new AbortController().signal })
  expect(callback).toHaveBeenCalledTimes(2)
})

test('reusable hooks run separately for parent, child, and router registrations', async () => {
  const callback = vi.fn()
  const hook = createHook({ hook: callback })
  const home = createRoute({ name: 'home', path: '/' })
  const parent = createRoute({ name: 'parent', path: '/parent' })
  const child = createRoute({ parent, name: 'child', path: '/child' })
  parent.onBeforeRouteEnter(hook)
  child.onBeforeRouteEnter(hook)
  const router = createRouter([home, parent, child], { initialUrl: '/' })
  router.onBeforeRouteEnter(hook)

  try {
    await router.start()
    callback.mockClear()
    await router.push('child')
    expect(callback).toHaveBeenCalledTimes(3)
    await router.push('home')
    callback.mockClear()
    await router.push('parent')
    expect(callback).toHaveBeenCalledTimes(2)
  } finally {
    router.stop()
  }
})
