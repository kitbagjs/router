import { flushPromises } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { createComputationStore } from '@/services/createComputationStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getDataKey } from '@/services/getDataKey'
import { Computation, DataKind } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'

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

  return { route, computation }
}

describe('reads', () => {
  test.each(['loader', 'props'] as const)('reads pending and settled %s computations by location', async (kind) => {
    const pending = Promise.withResolvers<string>()
    const { route, computation } = createFixture(() => pending.promise, kind)
    const store = createComputationStore({ runWithContext: (callback) => callback() })
    store.compute(route, [computation])

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
    store.compute(route, [computation])
    const value = store.getValue(computation, route)
    pending.reject(error)

    await expect(value).rejects.toBe(error)
    await expect(store.getValue(computation, route)).rejects.toBe(error)
    await expect(store.subscribe(computation, route)).resolves.toEqual({ status: 'ERROR', source: kind, error })
  })

  test('getEntries collects entries across kinds', async () => {
    const { route, computation } = createFixture(() => 'loaded')
    const props = createComputation(route, () => ({ value: 'props' }), 'props')
    const store = createComputationStore({ runWithContext: (callback) => callback() })
    await Promise.all(store.compute(route, [computation, props]))
    const loaderValue = { key: computation.key, value: 'loaded' }
    const propsValue = { key: props.key, value: { value: 'props' } }

    expect(store.getEntries()).toEqual([loaderValue, propsValue])
  })
})

test('settled values remain readable after abandonment', async () => {
  const { route, computation } = createFixture(() => 'kept')
  const store = createComputationStore({ runWithContext: (callback) => callback() })
  await Promise.all(store.compute(route, [computation]))
  store.abandon()

  expect(store.getState(computation, route)).toEqual({ status: 'SUCCESS', value: 'kept' })
  await expect(store.getValue(computation, route)).resolves.toBe('kept')
})

test('prefetched errors are reported only when activated and late errors use the same handler', async () => {
  const error = new Error('prefetched error')
  const { route, computation } = createFixture(() => {
    throw error
  })
  const store = createComputationStore({ runWithContext: (callback) => callback() })
  const onResponse = vi.fn()
  await Promise.all(store.compute(route, [computation]))

  expect(onResponse).not.toHaveBeenCalled()
  store.activate(onResponse)
  await flushPromises()
  expect(onResponse).toHaveBeenCalledExactlyOnceWith({ status: 'ERROR', error, source: 'loader' })

  const lateError = new Error('late error')
  const late = createComputation(route, () => {
    throw lateError
  }, 'props', 'late')
  await Promise.all(store.compute(route, [late]))
  await flushPromises()
  expect(onResponse).toHaveBeenLastCalledWith({ status: 'ERROR', error: lateError, source: 'props' })
})

test.each([
  new ContextPushError(['/next']),
  new ContextRejectionError('NotFound'),
])('a prefetched $response.status cancels dependencies and is delivered once on activation', async (error) => {
  const gate = Promise.withResolvers<void>()
  const { route, computation } = createFixture(async () => {
    await gate.promise
    throw error
  })
  const cleaned = vi.fn()
  const dependent = createComputation(route, async ({ getValue }) => {
    try {
      await getValue(computation)
    } finally {
      cleaned()
    }
  }, 'props')
  const store = createComputationStore({ runWithContext: (callback) => callback() })
  const work = store.compute(route, [computation, dependent])
  gate.resolve()
  await Promise.allSettled(work)
  await flushPromises()
  expect(cleaned).toHaveBeenCalledOnce()
  expect(store.getState(dependent, route)).toEqual({ status: 'ABANDONED' })

  const onResponse = vi.fn()
  store.activate(onResponse)
  store.activate(onResponse)
  await flushPromises()
  expect(onResponse).toHaveBeenCalledExactlyOnceWith(error.response)
})

test('disposing prefetched work suppresses its response and unwinds pending readers', async () => {
  const { route, computation } = createFixture(() => new Promise(() => {}))
  const cleaned = vi.fn()
  const dependent = createComputation(route, async ({ getValue }) => {
    try {
      await getValue(computation)
    } finally {
      cleaned()
    }
  }, 'props')
  const store = createComputationStore({ runWithContext: (callback) => callback() })
  const work = store.compute(route, [computation, dependent])
  store.dispose()
  const onResponse = vi.fn()
  store.activate(onResponse)
  await Promise.allSettled(work)
  await flushPromises()

  expect(cleaned).toHaveBeenCalledOnce()
  expect(onResponse).not.toHaveBeenCalled()
})
