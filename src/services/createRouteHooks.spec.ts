import { expect, test, vi } from 'vitest'
import { createRouteHooks } from '@/services/createRouteHooks'

test.each([
  'onBeforeRouteEnter',
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
  'onAfterRouteEnter',
  'onAfterRouteUpdate',
  'onAfterRouteLeave',
  'onError',
  'onRejection',
] as const)('%s is removed when its signal aborts', (lifecycle) => {
  const hooks = createRouteHooks()
  const controller = new AbortController()
  const hook = vi.fn()

  hooks[lifecycle](hook, { signal: controller.signal })
  expect(hooks.store.has(hook, lifecycle)).toBe(true)

  controller.abort()
  expect(hooks.store.has(hook, lifecycle)).toBe(false)
})

test('an already-aborted signal skips registration and context discovery', () => {
  const hooks = createRouteHooks()
  const onHookAdded = vi.fn()
  hooks.store.onHookAdded.add(onHookAdded)

  hooks.onBeforeRouteEnter(() => {}, { signal: AbortSignal.abort() })

  expect(hooks.store.get('onBeforeRouteEnter').length).toBe(0)
  expect(onHookAdded).not.toHaveBeenCalled()
})

test('manual removal detaches the signal from a later registration', () => {
  const hooks = createRouteHooks()
  const controller = new AbortController()
  const hook = vi.fn()
  const remove = hooks.onAfterRouteEnter(hook, { signal: controller.signal })

  remove()
  hooks.onAfterRouteEnter(hook)
  controller.abort()

  expect(hooks.store.has(hook, 'onAfterRouteEnter')).toBe(true)
})
