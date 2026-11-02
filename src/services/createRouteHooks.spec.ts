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
  expect(hooks.store[lifecycle]).toHaveLength(1)

  controller.abort()
  expect(hooks.store[lifecycle]).toHaveLength(0)
})

test('an already-aborted signal skips registration and context discovery', () => {
  const hooks = createRouteHooks()
  const onHookAdded = vi.fn()
  hooks.store.onHookAdded.add(onHookAdded)

  hooks.onBeforeRouteEnter(() => {}, { signal: AbortSignal.abort() })

  expect(hooks.store.onBeforeRouteEnter.length).toBe(0)
  expect(onHookAdded).not.toHaveBeenCalled()
})

test('returns the registration remover', () => {
  const hooks = createRouteHooks()
  const hook = vi.fn()
  const remove = hooks.onAfterRouteEnter(hook)

  expect(hooks.store.onAfterRouteEnter).toHaveLength(1)

  remove()

  expect(hooks.store.onAfterRouteEnter).toHaveLength(0)
})
