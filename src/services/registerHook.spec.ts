import { expect, test, vi } from 'vitest'
import { Hooks } from '@/models/hooks'
import { registerHook } from '@/services/registerHook'

test('registration owns its remover even after aggregation', () => {
  const source = new Hooks()
  const callback = vi.fn()
  const remove = registerHook(source, callback, 'onBeforeRouteEnter')
  const entry = source.get('onBeforeRouteEnter')[0]
  const execution = new Hooks()
  execution.add(...source.get('onBeforeRouteEnter'))

  expect(entry.remove).toBe(remove)
  expect(registerHook(source, callback, 'onBeforeRouteEnter')).toBe(remove)
  expect(source.get('onBeforeRouteEnter')).toHaveLength(1)
  execution.getBeforeHooks()[0].remove()
  expect(source.has(entry)).toBe(false)
  expect(execution.has(entry)).toBe(true)
})

test('removal detaches the signal without affecting a later registration', () => {
  const source = new Hooks()
  const callback = vi.fn()
  const controller = new AbortController()
  const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener')
  const remove = registerHook(source, callback, 'onBeforeRouteEnter', { signal: controller.signal })

  remove()
  expect(removeEventListener).toHaveBeenCalledExactlyOnceWith('abort', remove)
  registerHook(source, callback, 'onBeforeRouteEnter')
  controller.abort()
  expect(source.get('onBeforeRouteEnter')).toHaveLength(1)
})

test('an aborted signal skips registration', () => {
  const source = new Hooks()
  const remove = registerHook(source, vi.fn(), 'onBeforeRouteEnter', { signal: AbortSignal.abort() })

  remove()
  expect(source.getBeforeHooks()).toEqual([])
})
