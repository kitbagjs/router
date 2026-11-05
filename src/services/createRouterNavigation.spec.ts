import { Computation, DataKind } from '@/types/computation'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getDataKey } from '@/services/getDataKey'
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
  test('entry methods stay scoped to their store and manager methods follow the current store', () => {
    const { route, computation } = createFixture(() => 'computed')
    const navigation = createRouterNavigation()
    const current = navigation.current()
    const prepared = navigation.create()
    navigation.setEntries([{ key: computation.key, value: 'current' }])
    prepared.setEntries([{ key: computation.key, value: 'prepared' }])

    expect(navigation.getEntries()).toEqual(current.getEntries())
    expect(prepared.getEntries()).toEqual([{ key: computation.key, value: 'prepared' }])
    prepared.stage()
    prepared.commit({ to: route, from: null })
    navigation.setEntries([{ key: 'extra', value: 'extra' }])

    expect(navigation.getEntries()).toEqual(prepared.getEntries())
    expect(prepared.getEntries()).toContainEqual({ key: 'extra', value: 'extra' })
  })
})

describe('navigation lifetime', () => {
  test('filled values are adopted instead of running their computation', async () => {
    const run = vi.fn(() => 'computed')
    const { route, computation } = createFixture(run)
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    prepared.setEntries([{ key: computation.key, value: 'filled' }])
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
    prepared.setEntries([{ key: computation.key, value: 'filled' }])

    expect(prepared.compute(route, [computation])).toEqual([])
    expect(prepared.commit({ to: route, from: null })).toEqual([])
    expect(run).not.toHaveBeenCalled()
    expect(prepared.getState(computation, route)).toEqual({ status: 'ABANDONED' })
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
  test('getValue reads from the computation navigation after subscriptions are queued', async () => {
    const warn = vi.spyOn(waitingWarnings, 'warnWaitingOnUncomputedValue').mockImplementation(() => {})
    const { route, computation } = createFixture(() => 'loaded')
    const dependent = createComputation(route, (context) => {
      return context.getValue(computation)
    }, 'props')
    registry.set(route.id, [dependent, computation])
    const navigation = createRouterNavigation()
    const prepared = navigation.create()
    await Promise.all(prepared.compute(route, [dependent, computation]))

    await expect(prepared.getValue(dependent, route)).resolves.toBe('loaded')
    expect(warn).not.toHaveBeenCalled()
  })

  test('disposing a prefetch unwinds a pending dependency', async () => {
    const cleaned = vi.fn()
    const { route, computation } = createFixture(() => new Promise(() => {}))
    const dependent = createComputation(route, async (context) => {
      try {
        await context.getValue(computation)
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
