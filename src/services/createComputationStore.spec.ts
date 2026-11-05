import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createComputationStore } from '@/services/createComputationStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getDataKey } from '@/services/getDataKey'
import { Computation, DataKind } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'
import * as computations from '@/services/getComputations'

const registry = new Map<string, Computation[]>()

beforeEach(() => {
  registry.clear()
  vi.spyOn(computations, 'getComputations').mockImplementation((route) => registry.get(route.id) ?? [])
})

function createComputation(route: ResolvedRoute, run: Computation['run'], kind: DataKind = 'loader', name = 'default'): Computation {
  return {
    kind,
    name,
    key: getDataKey({ kind, depth: 0, name, route }),
    prefetchKey: 'loaders',
    depth: 0,
    run,
    routePrefetch: undefined,
    prefetch: undefined,
    transformer: undefined,
  }
}

function createFixture(run: Computation['run'], kind: DataKind = 'loader'): { route: ResolvedRoute, computation: Computation } {
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const computation = createComputation(route, run, kind)

  registry.set(route.id, [computation])

  return { route, computation }
}

describe('reads', () => {
  test.each(['loader', 'props'] as const)('reads pending and settled %s computations by location', async (kind) => {
    const pending = Promise.withResolvers<string>()
    const { route, computation } = createFixture(() => pending.promise, kind)
    const store = createComputationStore({ runWithContext: (callback) => callback() })
    store.commit({ to: route, from: null })

    expect(store.getState(computation, route)).toEqual({ status: 'RUNNING' })
    const response = store.subscribe(computation, route)
    const value = store.getValue(computation, route)
    pending.resolve('loaded')

    await expect(response).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
    await expect(value).resolves.toBe('loaded')
    expect(store.getState(computation, route)).toEqual({ status: 'SUCCESS', value: 'loaded' })
  })

  test.each(['loader', 'props'] as const)('%s value reads reject with the original error before and after settlement', async (kind) => {
    const error = new Error('computation failed')
    const pending = Promise.withResolvers<string>()
    const { route, computation } = createFixture(() => pending.promise, kind)
    const store = createComputationStore({ runWithContext: (callback) => callback() })
    store.commit({ to: route, from: null })
    const value = store.getValue(computation, route)
    pending.reject(error)

    await expect(value).rejects.toBe(error)
    await expect(store.getValue(computation, route)).rejects.toBe(error)
    await expect(store.subscribe(computation, route)).resolves.toEqual({ status: 'ERROR', source: kind, error })
  })

  test('getEntries collects entries across kinds', async () => {
    const { route, computation } = createFixture(() => 'loaded')
    const props = createComputation(route, () => ({ value: 'props' }), 'props')
    registry.set(route.id, [computation, props])
    const store = createComputationStore({ runWithContext: (callback) => callback() })
    await Promise.all(store.commit({ to: route, from: null }))
    const loaderValue = { key: computation.key, value: 'loaded' }
    const propsValue = { key: props.key, value: { value: 'props' } }

    expect(store.getEntries()).toEqual([loaderValue, propsValue])
  })
})

test('compute shares explicitly supplied work without running other registered computations', async () => {
  const registered = vi.fn()
  const { route } = createFixture(registered)
  const pending = Promise.withResolvers<string>()
  const run = vi.fn(() => pending.promise)
  const extra = createComputation(route, run, 'props', 'extra')
  const store = createComputationStore({ runWithContext: (callback) => callback() })
  const [value] = store.compute(route, [extra])
  store.compute(route, [extra])

  expect(store.getState(extra, route)).toEqual({ status: 'RUNNING' })
  expect(run).toHaveBeenCalledOnce()
  expect(registered).not.toHaveBeenCalled()
  pending.resolve('loaded')
  await expect(value).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
})

test('settled values remain readable after abandonment', async () => {
  const { route, computation } = createFixture(() => 'kept')
  const store = createComputationStore({ runWithContext: (callback) => callback() })
  await Promise.all(store.commit({ to: route, from: null }))
  store.abandon()

  expect(store.getState(computation, route)).toEqual({ status: 'SUCCESS', value: 'kept' })
  await expect(store.getValue(computation, route)).resolves.toBe('kept')
})
