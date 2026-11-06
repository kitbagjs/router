import { assert, expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getComputations } from '@/services/getComputations'
import { NavigationOptions } from '@/services/createNavigation'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

function createPlan(load: () => unknown): NavigationOptions {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))

  return {
    route,
    computations: getComputations(route),
    loadViews: () => [],
    onCommit: () => {},
  }
}

test('adopting prefetched work retains its values and computation signal', async () => {
  const run = vi.fn((_route, { signal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(run))
  const computations = getComputations(route)
  const navigation = createRouterNavigation()
  const prefetch = navigation.createStore()
  await Promise.all(prefetch.compute(route, computations))
  const signal = run.mock.calls[0][1].signal

  await navigation.run({ route, computations, prefetch, loadViews: () => [], onCommit: () => {} })
  const active = navigation.active.value
  assert(active)

  expect(active.store).toBe(prefetch)
  expect(run).toHaveBeenCalledOnce()
  expect(signal.aborted).toBe(false)
  await expect(active.store.getValue(computations[0], route)).resolves.toBe(signal)

  await navigation.run(createPlan(() => 'next'))
  expect(signal.aborted).toBe(true)
})

test('preparing a replacement keeps active data until activation and leaves captured results readable', async () => {
  const navigation = createRouterNavigation()
  const first = createPlan(() => 'first')
  await navigation.run(first)
  const previous = navigation.active.value
  assert(previous?.route)
  const pending = Promise.withResolvers<string>()
  const next = createPlan(() => pending.promise)
  const work = navigation.run({ ...next, prepare: true })

  expect(navigation.active.value).toBe(previous)
  expect(previous.store.abandoned).toBe(false)
  await expect(previous.store.getValue(first.computations[0], previous.route)).resolves.toBe('first')

  pending.resolve('next')
  await work

  expect(navigation.active.value?.route).toBe(next.route)
  expect(previous.store.abandoned).toBe(true)
  await expect(previous.store.getValue(first.computations[0], previous.route)).resolves.toBe('first')
})

test('superseding preparation cancels its work without letting it activate or run after hooks', async () => {
  const navigation = createRouterNavigation()
  const ready = Promise.withResolvers<void>()
  const next = createPlan(() => ready.promise)
  const prefetch = navigation.createStore()
  const after = vi.fn()
  const onCommit = vi.fn()
  const preparing = navigation.run({ ...next, prefetch, prepare: true, after, onCommit })
  const replacement = createPlan(() => 'replacement')

  await navigation.run(replacement)
  await preparing

  expect(prefetch.abandoned).toBe(true)
  expect(navigation.active.value?.route).toBe(replacement.route)
  expect(onCommit).not.toHaveBeenCalled()
  expect(after).not.toHaveBeenCalled()
})

test('stop cancels active and pending computations and prevents future activation', async () => {
  const navigation = createRouterNavigation()
  const plan = createPlan(() => new Promise(() => {}))
  await navigation.run(plan)
  const active = navigation.active.value
  assert(active?.route)
  const prefetch = navigation.createStore()
  const pending = navigation.run({ ...plan, prefetch, prepare: true })
  const activeValue = active.store.getValue(plan.computations[0], active.route)
  const pendingValue = prefetch.getValue(plan.computations[0], active.route)

  navigation.stop()
  await pending

  await expect(activeValue).rejects.toBeInstanceOf(NavigationAbandonedError)
  await expect(pendingValue).rejects.toBeInstanceOf(NavigationAbandonedError)
  const onCommit = vi.fn()
  await navigation.run({ ...createPlan(() => 'stopped'), onCommit })
  expect(onCommit).not.toHaveBeenCalled()
})
