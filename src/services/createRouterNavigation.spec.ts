import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { Computation } from '@/services/getComputations'
import { DataKind, getDataKey } from '@/services/getDataKey'
import { ResolvedRoute } from '@/types/resolved'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import * as computations from '@/services/getComputations'
import * as waitingWarnings from '@/services/warnWaitingOnUncomputedValue'

const registry = new Map<string, Computation[]>()

beforeEach(() => {
  registry.clear()
  vi.spyOn(computations, 'getComputations').mockImplementation((route) => registry.get(route.id) ?? [])
})

afterEach(() => {
  vi.restoreAllMocks()
})

function createComputation(route: ResolvedRoute, run: Computation['run'], kind: DataKind = 'loader', name = 'default'): Computation {
  return {
    kind,
    id: route.id,
    name,
    key: getDataKey(kind, route.id, name, route),
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
    const navigation = createRouterNavigation()
    navigation.commit({ to: route, from: null })

    expect(navigation.getState(computation, route)).toEqual({ status: 'RUNNING' })
    const response = navigation.subscribe(computation, route)
    const value = navigation.getValue(computation, route)
    pending.resolve('loaded')

    await expect(response).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
    await expect(value).resolves.toBe('loaded')
    expect(navigation.getState(computation, route)).toEqual({ status: 'SUCCESS', value: 'loaded' })
  })

  test.each(['loader', 'props'] as const)('%s value reads reject with the original error before and after settlement', async (kind) => {
    const error = new Error('computation failed')
    const pending = Promise.withResolvers<string>()
    const { route, computation } = createFixture(() => pending.promise, kind)
    const navigation = createRouterNavigation()
    navigation.commit({ to: route, from: null })
    const value = navigation.getValue(computation, route)
    pending.reject(error)

    await expect(value).rejects.toBe(error)
    await expect(navigation.getValue(computation, route)).rejects.toBe(error)
    await expect(navigation.subscribe(computation, route)).resolves.toEqual({ status: 'ERROR', source: kind, error })
  })

  test('getValues collects successful values and can restrict their kind', async () => {
    const { route, computation } = createFixture(() => 'loaded')
    const props = createComputation(route, () => ({ value: 'props' }), 'props')
    registry.set(route.id, [computation, props])
    const navigation = createRouterNavigation()
    await Promise.all(navigation.commit({ to: route, from: null }))
    const loaderValue = { kind: 'loader', depth: 0, name: 'default', value: 'loaded' }
    const propsValue = { kind: 'props', depth: 0, name: 'default', value: { value: 'props' } }

    expect(navigation.getValues(route)).toEqual([loaderValue, propsValue])
    expect(navigation.getValues(route, 'loader')).toEqual([loaderValue])
    expect(navigation.getValues(route, 'props')).toEqual([propsValue])
  })
})

describe('navigation lifetime', () => {
  test('filled values are adopted instead of running their computation', async () => {
    const run = vi.fn(() => 'computed')
    const { route, computation } = createFixture(run)
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    prepared.fill(route, [{ kind: 'loader', depth: 0, name: 'default', value: 'filled' }])
    prepared.stage()
    await Promise.all(navigation.commit({ to: route, from: null }))

    await expect(navigation.getValue(computation, route)).resolves.toBe('filled')
    expect(run).not.toHaveBeenCalled()
  })

  test('repeated staging and commit adopt the same computation and signal', async () => {
    const run = vi.fn<Computation['run']>(({ signal }) => signal)
    const { route, computation } = createFixture(run)
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    await Promise.all(prepared.compute(route, [computation]))
    const signal = run.mock.calls[0][0].signal
    prepared.stage()
    prepared.stage()
    await Promise.all(navigation.commit({ to: route, from: null }))
    prepared.stage()
    await Promise.all(prepared.commit({ to: route, from: null }))

    expect(run).toHaveBeenCalledOnce()
    expect(signal.aborted).toBe(false)
    await expect(navigation.getValue(computation, route)).resolves.toBe(signal)

    navigation.commit({ to: createFixture(() => 'next').route, from: route })
    expect(signal.aborted).toBe(true)
  })

  test('staging a replacement preserves current values and signal until commit', async () => {
    const run = vi.fn<Computation['run']>(() => 'current')
    const current = createFixture(run)
    const next = createFixture(() => 'next')
    const navigation = createRouterNavigation()
    await Promise.all(navigation.commit({ to: current.route, from: null }))
    const signal = run.mock.calls[0][0].signal
    const prepared = navigation.create()
    await Promise.all(prepared.compute(next.route, [next.computation]))
    prepared.stage()

    expect(signal.aborted).toBe(false)
    await expect(navigation.getValue(current.computation, current.route)).resolves.toBe('current')
    await Promise.all(navigation.commit({ to: next.route, from: current.route }))
    expect(signal.aborted).toBe(true)
    await expect(navigation.getValue(next.computation, next.route)).resolves.toBe('next')
  })

  test('disposing a detached navigation aborts its computation signal', async () => {
    const run = vi.fn<Computation['run']>(({ signal }) => signal)
    const { route, computation } = createFixture(run)
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    await Promise.all(prepared.compute(route, [computation]))
    const signal = run.mock.calls[0][0].signal

    prepared.dispose()

    expect(signal.aborted).toBe(true)
  })

  test('disposed navigations skip computation, filling, and commit', () => {
    const run = vi.fn()
    const { route, computation } = createFixture(run)
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    prepared.dispose()
    prepared.fill(route, [{ kind: 'loader', depth: 0, name: 'default', value: 'filled' }])

    expect(prepared.compute(route, [computation])).toEqual([])
    expect(prepared.commit({ to: route, from: null })).toEqual([])
    expect(run).not.toHaveBeenCalled()
    expect(prepared.getState(computation, route)).toEqual({ status: 'ABANDONED' })
  })

  test('compute shares explicitly supplied work without running other registered computations', async () => {
    const registered = vi.fn()
    const { route } = createFixture(registered)
    const pending = Promise.withResolvers<string>()
    const run = vi.fn(() => pending.promise)
    const extra = createComputation(route, run, 'props', 'extra')
    const navigation = createRouterNavigation()
    const current = navigation.current()
    const [value] = current.compute(route, [extra])
    current.compute(route, [extra])

    expect(current.getState(extra, route)).toEqual({ status: 'RUNNING' })
    expect(run).toHaveBeenCalledOnce()
    expect(registered).not.toHaveBeenCalled()
    pending.resolve('loaded')
    await expect(value).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
  })

  test('stop aborts current and staged work and rejects pending and subsequent reads', async () => {
    const run = vi.fn(() => new Promise(() => {}))
    const { route, computation } = createFixture(run)
    const navigation = createRouterNavigation()
    const [current] = navigation.current().compute(route, [computation])
    const [staged] = navigation.staged().compute(route, [computation])

    navigation.stop()

    expect(run.mock.calls).toHaveLength(2)
    await expect(current).rejects.toBeInstanceOf(NavigationAbandonedError)
    await expect(staged).rejects.toBeInstanceOf(NavigationAbandonedError)
    expect(navigation.getState(computation, route)).toEqual({ status: 'ABANDONED' })
    await expect(navigation.getValue(computation, route)).rejects.toBeInstanceOf(NavigationAbandonedError)
  })

  test('settled values remain readable after abandonment', async () => {
    const { route, computation } = createFixture(() => 'kept')
    const navigation = createRouterNavigation()
    const current = navigation.current()
    await Promise.all(current.commit({ to: route, from: null }))
    current.abandon()

    expect(navigation.getState(computation, route)).toEqual({ status: 'SUCCESS', value: 'kept' })
    await expect(navigation.getValue(computation, route)).resolves.toBe('kept')
  })
})

const actions = [
  new ContextPushError(['/next']),
  new ContextRejectionError('NotFound'),
]

describe('response delivery', () => {
  test.each(actions)('subscriptions preserve $response.status and report it only after commit', async (error) => {
    const { route, computation } = createFixture(() => {
      throw error
    })
    const onResponse = vi.fn()
    const navigation = createRouterNavigation({ onResponse })
    const prepared = navigation.create()
    await Promise.all(prepared.compute(route, [computation]))

    await expect(prepared.subscribe(computation, route)).resolves.toEqual(error.response)
    expect(onResponse).not.toHaveBeenCalled()
    prepared.commit({ to: route, from: null })
    await flushPromises()
    expect(onResponse).toHaveBeenCalledExactlyOnceWith({ response: error.response, to: route, from: null })
  })

  test('prefetched errors are stored without reporting until commit', async () => {
    const error = new Error('computation failed')
    const { route, computation } = createFixture(() => {
      throw error
    })
    const onResponse = vi.fn()
    const navigation = createRouterNavigation({ onResponse })
    const prepared = navigation.create()
    prepared.compute(route, [computation])
    await flushPromises()

    expect(prepared.getState(computation, route)).toEqual({ status: 'ERROR', source: 'loader', error })
    expect(onResponse).not.toHaveBeenCalled()
    prepared.commit({ to: route, from: null })
    await flushPromises()
    expect(onResponse).toHaveBeenCalledExactlyOnceWith({ response: { status: 'ERROR', source: 'loader', error }, to: route, from: null })
  })

  test('an error does not prevent a later navigation action', async () => {
    const error = new Error('failed')
    const pending = Promise.withResolvers<void>()
    const { route, computation } = createFixture(() => {
      throw error
    })
    const later = createComputation(route, async () => {
      await pending.promise
      throw new ContextPushError(['/next'])
    }, 'props')
    registry.set(route.id, [computation, later])
    const onResponse = vi.fn()
    const navigation = createRouterNavigation({ onResponse })
    navigation.commit({ to: route, from: null })
    await flushPromises()
    expect(onResponse).toHaveBeenCalledOnce()

    pending.resolve()
    await flushPromises()
    expect(onResponse).toHaveBeenCalledTimes(2)
    expect(onResponse).toHaveBeenLastCalledWith({ response: { status: 'PUSH', to: ['/next'] }, to: route, from: null })
  })

  test('discarded prefetched responses do not affect the next navigation', async () => {
    const prefetched = createFixture(() => {
      throw new ContextPushError(['/old'])
    })
    const target = createFixture(() => 'target')
    const onResponse = vi.fn()
    const navigation = createRouterNavigation({ onResponse })
    const prepared = navigation.create()
    await Promise.all(prepared.compute(prefetched.route, [prefetched.computation]))
    prepared.dispose()
    await Promise.all(navigation.commit({ to: target.route, from: null }))
    await flushPromises()

    expect(onResponse).not.toHaveBeenCalled()
    await expect(navigation.getValue(target.computation, target.route)).resolves.toBe('target')
  })

  test('disposing immediately after commit prevents delivery of a settled response', async () => {
    const { route } = createFixture(() => {
      throw new ContextPushError(['/next'])
    })
    const onResponse = vi.fn()
    const navigation = createRouterNavigation({ onResponse })
    navigation.commit({ to: route, from: null })
    navigation.current().dispose()
    await flushPromises()

    expect(onResponse).not.toHaveBeenCalled()
  })

  test('late work started on a committed navigation reports its response', async () => {
    const { route } = createFixture(() => 'initial')
    const onResponse = vi.fn()
    const navigation = createRouterNavigation({ onResponse })
    await Promise.all(navigation.commit({ to: route, from: null }))
    const late = createComputation(route, () => {
      throw new ContextPushError(['/next'])
    }, 'props', 'late')
    await Promise.all(navigation.current().compute(route, [late]))
    await flushPromises()

    expect(onResponse).toHaveBeenCalledExactlyOnceWith({ response: { status: 'PUSH', to: ['/next'] }, to: route, from: null })
  })
})

describe('dependencies', () => {
  test('all subscriptions are queued before callbacks read later computations', async () => {
    const warn = vi.spyOn(waitingWarnings, 'warnWaitingOnUncomputedValue').mockImplementation(() => {})
    const { route, computation } = createFixture(() => 'loaded')
    const dependent = createComputation(route, ({ getValue }) => getValue(computation), 'props')
    registry.set(route.id, [dependent, computation])
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    await Promise.all(prepared.compute(route, [dependent, computation]))

    await expect(prepared.getValue(dependent, route)).resolves.toBe('loaded')
    expect(warn).not.toHaveBeenCalled()
  })

  test('subscriptions prefer a local computation over an older committed value', async () => {
    let value = Promise.resolve('original')
    const { route, computation } = createFixture(() => value)
    const dependent = createComputation(route, ({ subscribe }) => subscribe(computation), 'props')
    registry.set(route.id, [computation, dependent])
    const navigation = createRouterNavigation()
    await Promise.all(navigation.commit({ to: route, from: null }))
    const pending = Promise.withResolvers<string>()
    value = pending.promise
    const prepared = navigation.create()
    const work = prepared.compute(route, [computation, dependent])

    expect(prepared.getState(dependent, route).status).toBe('RUNNING')
    pending.resolve('updated')
    await Promise.all(work)
    await expect(prepared.getValue(dependent, route)).resolves.toEqual({ status: 'SUCCESS', value: 'updated' })
  })

  test('subscriptions preserve errors from a committed fallback source', async () => {
    const error = new Error('dependency failed')
    const { route, computation } = createFixture(() => {
      throw error
    })
    const navigation = createRouterNavigation()
    await Promise.all(navigation.commit({ to: route, from: null }))
    const dependent = createComputation(route, ({ subscribe }) => subscribe(computation), 'props')
    const prepared = navigation.create()
    await Promise.all(prepared.compute(route, [dependent]))

    await expect(prepared.getValue(dependent, route)).resolves.toEqual({ status: 'ERROR', source: 'loader', error })
  })

  test.each(['getValue', 'subscribe'] as const)('disposing a prefetch unwinds a pending %s dependency', async (read) => {
    const cleaned = vi.fn()
    const { route, computation } = createFixture(() => new Promise(() => {}))
    const dependent = createComputation(route, async (context) => {
      try {
        await context[read](computation)
      } finally {
        cleaned()
      }
    }, 'props')
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    const work = prepared.compute(route, [computation, dependent])
    prepared.dispose()
    await Promise.allSettled(work)
    await flushPromises()

    expect(cleaned).toHaveBeenCalledOnce()
  })

  test.each(actions)('$response.status abandons pending computations and unwinds their dependencies', async (error) => {
    const gate = Promise.withResolvers<void>()
    const cleaned = vi.fn()
    const continued = vi.fn()
    const { route, computation } = createFixture(async () => {
      await gate.promise
      throw error
    })
    const dependent = createComputation(route, async ({ getValue }) => {
      try {
        await getValue(computation)
        continued()
      } finally {
        cleaned()
      }
    }, 'props')
    registry.set(route.id, [computation, dependent])
    const navigation = createRouterNavigation()
    const work = navigation.commit({ to: route, from: null })
    gate.resolve()
    await Promise.allSettled(work)
    await flushPromises()

    expect(cleaned).toHaveBeenCalledOnce()
    expect(continued).not.toHaveBeenCalled()
    expect(navigation.getState(dependent, route)).toEqual({ status: 'ABANDONED' })
  })
})
