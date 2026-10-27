import { expect, test, vi } from 'vitest'
import { createHooksCollection } from '@/services/createHooksCollection'
import { createRouteHooks } from '@/services/createRouteHooks'

test('add preserves registration order across stores and selects one hook kind', () => {
  const first = createRouteHooks()
  const second = createRouteHooks()
  const shared = vi.fn()
  const other = vi.fn()
  first.onBeforeRouteEnter(shared)
  first.onBeforeRouteEnter(other)
  first.onAfterRouteEnter(other)
  second.onBeforeRouteEnter(shared)
  const collection = createHooksCollection()

  collection.add(first.store, 'onBeforeRouteEnter')
  collection.add(second.store, 'onBeforeRouteEnter')

  expect(collection.onBeforeRouteEnter).toEqual([shared, other, shared])
  expect(collection.onAfterRouteEnter).toEqual([])
  expect([...first.store.onBeforeRouteEnter]).toEqual([shared, other])
  expect([...second.store.onBeforeRouteEnter]).toEqual([shared])
})

test('add takes a snapshot without changing the source registrations', () => {
  const source = createRouteHooks()
  const original = vi.fn()
  const replacement = vi.fn()
  const remove = source.onBeforeRouteEnter(original)
  const collection = createHooksCollection()
  collection.add(source.store, 'onBeforeRouteEnter')

  remove()
  source.onBeforeRouteEnter(replacement)
  expect(collection.onBeforeRouteEnter).toEqual([original])

  const next = createHooksCollection()
  next.add(source.store, 'onBeforeRouteEnter')
  expect(next.onBeforeRouteEnter).toEqual([replacement])
})
