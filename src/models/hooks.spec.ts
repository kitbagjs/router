import { expect, test, vi } from 'vitest'
import { Hooks } from '@/models/hooks'
import { BeforeEnterHook, HookEntry } from '@/types/hooks'

function createEntry(): HookEntry<BeforeEnterHook> {
  return { lifecycle: 'onBeforeRouteEnter', hook: vi.fn(), remove: vi.fn() }
}

test('add preserves entry order and allows deliberate duplicates', () => {
  const hooks = new Hooks()
  const first = createEntry()
  const second = createEntry()
  hooks.add(first, second, first)

  expect(hooks.get('onBeforeRouteEnter')).toEqual([first, second, first])
  expect(hooks.get('onAfterRouteEnter')).toEqual([])
  expect(hooks.has(first)).toBe(true)
  expect(hooks.delete(first)).toBe(true)
  expect(hooks.get('onBeforeRouteEnter')).toEqual([second, first])
  expect(hooks.delete(first)).toBe(true)
  expect(hooks.delete(first)).toBe(false)
  expect(hooks.has(first)).toBe(false)
})

test('get returns a snapshot of the selected entries', () => {
  const hooks = new Hooks()
  const original = createEntry()
  const replacement = createEntry()
  hooks.add(original)
  const snapshot = hooks.get('onBeforeRouteEnter')

  hooks.delete(original)
  hooks.add(replacement)
  expect(snapshot).toEqual([original])
  expect(hooks.get('onBeforeRouteEnter')).toEqual([replacement])
  snapshot.pop()
  expect(hooks.get('onBeforeRouteEnter')).toEqual([replacement])
})

test('aggregation retains the same entry and remover across containers', () => {
  const source = new Hooks()
  const entry = createEntry()
  source.add(entry)
  const intermediate = new Hooks()
  intermediate.add(...source.get('onBeforeRouteEnter'))
  const execution = new Hooks()
  execution.add(...intermediate.getBeforeHooks())

  expect(execution.getBeforeHooks()[0]).toBe(entry)
  execution.getBeforeHooks()[0].remove()
  expect(entry.remove).toHaveBeenCalledOnce()
  expect(source.has(entry)).toBe(true)
  execution.delete(entry)
  expect(execution.has(entry)).toBe(false)
  expect(source.has(entry)).toBe(true)
  expect(entry.remove).toHaveBeenCalledOnce()
})

test('has allows callers to opt into deduplication', () => {
  const hooks = new Hooks()
  const entry = createEntry()
  hooks.add(entry)

  if (!hooks.has(entry)) {
    hooks.add(entry)
  }

  expect(hooks.getBeforeHooks()).toEqual([entry])
})
