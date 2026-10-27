import { expect, test, vi } from 'vitest'
import { Hooks } from '@/models/hooks'
import { createRouteHooks } from '@/services/createRouteHooks'

test('aggregation preserves registration order across stores and selects one hook kind', () => {
  const first = createRouteHooks()
  const second = createRouteHooks()
  const shared = vi.fn()
  const other = vi.fn()
  first.onBeforeRouteEnter(shared)
  first.onBeforeRouteEnter(other)
  first.onAfterRouteEnter(other)
  second.onBeforeRouteEnter(shared)
  const hooks = new Hooks()

  hooks.add(first.store, 'onBeforeRouteEnter')
  hooks.add(second.store, 'onBeforeRouteEnter')

  expect(hooks.get('onBeforeRouteEnter').map(({ hook }) => hook)).toEqual([shared, other, shared])
  expect(hooks.get('onAfterRouteEnter')).toEqual([])
  expect(first.store.get('onBeforeRouteEnter').map(({ hook }) => hook)).toEqual([shared, other])
  expect(second.store.get('onBeforeRouteEnter').map(({ hook }) => hook)).toEqual([shared])
})

test('aggregation takes a snapshot without changing the source registrations', () => {
  const source = new Hooks()
  const original = vi.fn()
  const replacement = vi.fn()
  const entry = source.add(original, 'onBeforeRouteEnter')
  const hooks = new Hooks()
  hooks.add(source, 'onBeforeRouteEnter')

  entry.remove()
  source.add(replacement, 'onBeforeRouteEnter')
  expect(hooks.get('onBeforeRouteEnter')).toEqual([entry])

  const next = new Hooks()
  next.add(source, 'onBeforeRouteEnter')
  expect(next.get('onBeforeRouteEnter').map(({ hook }) => hook)).toEqual([replacement])
})

test('aggregation through multiple containers retains one original remover', () => {
  const source = new Hooks()
  const callback = vi.fn()
  const entry = source.add(callback, 'onBeforeRouteEnter')
  const intermediate = new Hooks()
  intermediate.add(entry, 'onBeforeRouteEnter')
  const execution = new Hooks()
  execution.add(intermediate, 'onBeforeRouteEnter')

  expect(execution.get('onBeforeRouteEnter')[0]).toBe(entry)
  execution.get('onBeforeRouteEnter')[0].remove()
  expect(source.has(callback, 'onBeforeRouteEnter')).toBe(false)
  expect(intermediate.get('onBeforeRouteEnter')[0]).toBe(entry)
})

test('add permits separate registrations and delete removes only the selected registration', () => {
  const hooks = new Hooks()
  const callback = vi.fn()
  const first = hooks.add(callback, 'onBeforeRouteEnter')
  const second = hooks.add(callback, 'onBeforeRouteEnter')

  expect(hooks.has(first, 'onBeforeRouteEnter')).toBe(true)
  expect(hooks.delete(first, 'onBeforeRouteEnter')).toBe(true)
  expect(hooks.delete(first, 'onBeforeRouteEnter')).toBe(false)
  expect(hooks.get('onBeforeRouteEnter')).toEqual([second])
  expect(hooks.has(callback, 'onBeforeRouteEnter')).toBe(true)
  expect(hooks.delete(callback, 'onBeforeRouteEnter')).toBe(true)
  expect(hooks.has(callback, 'onBeforeRouteEnter')).toBe(false)
})

test('delete on an aggregate unregisters only the matching source registration', () => {
  const first = new Hooks()
  const second = new Hooks()
  const callback = vi.fn()
  const entry = first.add(callback, 'onBeforeRouteEnter')
  second.add(callback, 'onBeforeRouteEnter')
  const execution = new Hooks()
  execution.add(first, 'onBeforeRouteEnter')
  execution.add(second, 'onBeforeRouteEnter')

  execution.delete(entry, 'onBeforeRouteEnter')
  expect(first.has(callback, 'onBeforeRouteEnter')).toBe(false)
  expect(second.has(callback, 'onBeforeRouteEnter')).toBe(true)
  expect(execution.get('onBeforeRouteEnter')).toEqual(second.get('onBeforeRouteEnter'))
})

test('has allows callers to opt into deduplication', () => {
  const hooks = new Hooks()
  const callback = vi.fn()
  hooks.add(callback, 'onBeforeRouteEnter')

  if (!hooks.has(callback, 'onBeforeRouteEnter')) {
    hooks.add(callback, 'onBeforeRouteEnter')
  }

  expect(hooks.get('onBeforeRouteEnter')).toHaveLength(1)
})

test('aborted signals skip registration and deletion detaches the signal listener', () => {
  const hooks = new Hooks()
  const callback = vi.fn()
  hooks.add(callback, 'onBeforeRouteEnter', { signal: AbortSignal.abort() })
  expect(hooks.has(callback, 'onBeforeRouteEnter')).toBe(false)
  const controller = new AbortController()
  const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener')
  const entry = hooks.add(callback, 'onBeforeRouteEnter', { signal: controller.signal })

  hooks.delete(entry, 'onBeforeRouteEnter')
  expect(removeEventListener).toHaveBeenCalledExactlyOnceWith('abort', entry.remove)
  const replacement = hooks.add(callback, 'onBeforeRouteEnter')
  controller.abort()
  expect(hooks.get('onBeforeRouteEnter')).toEqual([replacement])
})
