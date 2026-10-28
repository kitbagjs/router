import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRouter } from '@/services/createRouter'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterHooks } from '@/services/createRouterHooks'
import { component } from '@/utilities/testHelpers'

test.each([
  'onBeforeRouteEnter',
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
  'onAfterRouteEnter',
  'onAfterRouteUpdate',
  'onAfterRouteLeave',
] as const)('%s returns the receiving route and still registers immediately', async (lifecycle) => {
  const route = createRoute({ name: 'target', path: '/target' }).addView(component)
  const hook = vi.fn()

  expect(route[lifecycle](hook)).toBe(route)

  const runner = createRouterHooks({ redirectStatus: 302 })
  const resolved = createResolvedRoute(route)
  const run = lifecycle.startsWith('onBefore') ? runner.runBeforeRouteHooks : runner.runAfterRouteHooks

  await run({
    to: lifecycle.endsWith('Leave') ? null : resolved,
    from: lifecycle.endsWith('Enter') ? null : resolved,
    signal: new AbortController().signal,
  })
  expect(hook).toHaveBeenCalledOnce()
})

test('chained hooks support self-removal and external cancellation', async () => {
  const once = vi.fn()
  const cancelled = vi.fn()
  const controller = new AbortController()
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({ name: 'target', path: '/target' })
    .onBeforeRouteEnter((_to, { remove }) => {
      once()
      remove()
    })
    .addView(component)
    .onAfterRouteEnter(cancelled, { signal: controller.signal })
  const router = createRouter([home, route], { initialUrl: '/' })

  try {
    await router.start()
    await router.push('target')
    controller.abort()
    await router.push('home')
    await router.push('target')
    expect(once).toHaveBeenCalledTimes(1)
    expect(cancelled).toHaveBeenCalledTimes(1)
  } finally {
    router.stop()
  }
})

test('external route hooks return the receiving route', () => {
  const parent = createExternalRoute({ host: 'https://example.com', path: '/parent' })
  const child = createExternalRoute({ parent, name: 'child', path: '/child' })

  expect(parent.onBeforeRouteEnter(() => {})).toBe(parent)
  expect(child.onBeforeRouteEnter(() => {})).toBe(child)
})
