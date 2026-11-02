import * as waitingWarnings from '@/services/warnWaitingOnUncomputedValue'
import { afterEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { ComputationContext, getComputations, loaderLocations } from '@/services/getComputations'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

afterEach(() => {
  vi.restoreAllMocks()
})

test('loader data rejects with the original callback error', async () => {
  const error = new Error('loader failed')
  const pending = Promise.withResolvers<string>()
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => pending.promise))
  const navigation = createRouterNavigation()

  navigation.commit({ to: route, from: null })
  const data = navigation.getValue(loaderLocations(route.matches[0])[0], route)
  pending.reject(error)

  await expect(data).rejects.toBe(error)
  await expect(navigation.getValue(loaderLocations(route.matches[0])[0], route)).rejects.toBe(error)
})

test('subscriptions preserve push responses from computations', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { push }) => push('/next')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })

  navigation.commit({ to: route, from: null })

  const result = await navigation.subscribe(loaderLocations(route.matches[0])[0], route)
  await flushPromises()

  expect(result).toMatchObject({ status: 'PUSH' })
  expect(onResponse).toHaveBeenCalledExactlyOnceWith({
    response: { status: 'PUSH', to: ['/next'] },
    to: route,
    from: null,
  })
})

test('subscriptions preserve rejection responses from computations', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { reject }) => reject('NotFound')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })

  navigation.commit({ to: route, from: null })

  const result = await navigation.subscribe(loaderLocations(route.matches[0])[0], route)
  await flushPromises()

  expect(result).toMatchObject({ status: 'REJECT' })
  expect(onResponse).toHaveBeenCalledExactlyOnceWith({
    response: { status: 'REJECT', type: 'NotFound' },
    to: route,
    from: null,
  })
})

test('a staged value is adopted in place of running its getter', async () => {
  const loader = vi.fn(() => 'computed')
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(loader)
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const detached = navigation.create()

  detached.fill(resolved, [{ kind: 'loader', depth: 0, name: 'default', value: 'staged' }])
  detached.stage()
  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getValue(loaderLocations(resolved.matches[0])[0], resolved)).resolves.toBe('staged')
  expect(loader).not.toHaveBeenCalled()
})

test('getValues returns the values the navigation resolved', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => 'value')
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })
  await flushPromises()

  expect(navigation.getValues(resolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'value' }])
})

test('staged values are adopted by the next navigation without running their getters again', async () => {
  const loader = vi.fn(() => 'value')
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(loader)
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  await Promise.all(navigation.staged().compute(resolved, getComputations(resolved)))
  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getValue(loaderLocations(resolved.matches[0])[0], resolved)).resolves.toBe('value')
  expect(loader).toHaveBeenCalledTimes(1)
})

test('staging a route leaves the current route reading its own values', async () => {
  const current = createRoute({ name: 'current', path: '/current' }).addView(component)
    .addLoader(() => 'current')
  const next = createRoute({ name: 'next', path: '/next' }).addView(component)
    .addLoader(() => 'next')
  const navigation = createRouterNavigation()
  const currentResolved = createResolvedRoute(current)
  const nextResolved = createResolvedRoute(next)

  navigation.commit({ to: currentResolved, from: null })
  await flushPromises()

  navigation.staged().compute(nextResolved, getComputations(nextResolved))

  expect(navigation.getValues(currentResolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'current' }])
})

test('a staged props getter can await a later loader without warnings', async () => {
  const warn = vi.spyOn(waitingWarnings, 'warnWaitingOnUncomputedValue').mockImplementation(() => {})
  const route = createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: async (route) => ({ value: await route.getData() }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const staged = navigation.staged()
  const computations = getComputations(resolved)
  const values = staged.compute(resolved, computations)

  await Promise.all(values)
  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getValue({ kind: 'props', id: route.id, name: 'default' }, resolved)).resolves.toEqual({ value: 'loaded' })
  expect(warn).not.toHaveBeenCalled()
})

test('prefetch errors do not cause unhandled rejections', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => {
      throw new Error('getter failed')
    })
  const navigation = createRouterNavigation()
  const detached = navigation.create()

  const resolved = createResolvedRoute(route)
  detached.compute(resolved, getComputations(resolved))

  await flushPromises()
})

test('disposing a detached navigation aborts the signal its getters were given', async () => {
  const seen = Promise.withResolvers<AbortSignal>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader((_route, { signal }) => {
      seen.resolve(signal)

      return 'value'
    })
  const navigation = createRouterNavigation()
  const detached = navigation.create()

  const resolved = createResolvedRoute(route)
  detached.compute(resolved, getComputations(resolved))

  const signal = await seen.promise

  expect(signal.aborted).toBe(false)

  detached.dispose()

  expect(signal.aborted).toBe(true)
})

test('a staged getter keeps its signal until the navigation that adopted it is replaced', async () => {
  const seen = Promise.withResolvers<AbortSignal>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader((_route, { signal }) => {
      seen.resolve(signal)

      return 'value'
    })
  const other = createRoute({ name: 'other', path: '/other' }).addView(component)
    .addLoader(() => 'other')
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()
  const detached = navigation.create()

  detached.compute(resolved, getComputations(resolved))
  detached.stage()
  navigation.commit({ to: resolved, from: null })

  const signal = await seen.promise

  expect(signal.aborted).toBe(false)

  navigation.commit({ to: createResolvedRoute(other), from: resolved })

  expect(signal.aborted).toBe(true)
})

test('staging and committing the same instance preserves its computations', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await Promise.all(instance.compute(route, getComputations(route)))
  const signal = load.mock.results[0].value

  instance.stage()
  instance.stage()
  await Promise.all(instance.commit({ to: route, from: null }))
  instance.stage()
  await Promise.all(instance.commit({ to: route, from: null }))

  expect(signal.aborted).toBe(false)
  expect(load).toHaveBeenCalledOnce()
  await expect(navigation.getValue(loaderLocations(route.matches[0])[0], route)).resolves.toBe(signal)
})

test('staging another instance keeps the current navigation active', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await Promise.all(instance.commit({ to: route, from: null }))
  const signal = load.mock.results[0].value

  instance.stage()
  navigation.create().stage()

  expect(signal.aborted).toBe(false)
  await Promise.all(navigation.commit({ to: route, from: null }))
  expect(signal.aborted).toBe(true)
})

test('an aborted navigation skips computation and filling', async () => {
  const load = vi.fn(() => 'loaded')
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const current = navigation.current()
  current.dispose()

  current.fill(route, [{ kind: 'loader', depth: 0, name: 'default', value: 'filled' }])
  const values = current.compute(route, getComputations(route))

  expect(values).toEqual([])
  expect(load).not.toHaveBeenCalled()
  expect(navigation.getValues(route)).toEqual([])
})

test('the current navigation shares explicitly supplied computations', async () => {
  const attached = vi.fn(() => 'attached')
  const pending = Promise.withResolvers<string>()
  const run = vi.fn(() => pending.promise)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(attached))
  const computation = {
    ...getComputations(route)[0],
    key: 'extra',
    name: 'extra',
    run,
  }
  const navigation = createRouterNavigation()
  const current = navigation.current()

  const values = current.compute(route, [computation])
  current.compute(route, [computation])

  expect(current.data.get(computation.key)).toEqual({ status: 'RUNNING' })
  expect(run).toHaveBeenCalledOnce()
  expect(attached).not.toHaveBeenCalled()

  pending.resolve('loaded')
  await expect(values[0]).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
})

test('a prefetched response is reported when its navigation becomes current', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { replace }) => replace('/next')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const detached = navigation.create()

  await Promise.allSettled(detached.compute(route, getComputations(route)))

  expect(onResponse).not.toHaveBeenCalled()
  const from = createResolvedRoute(createRoute({ path: '/previous' }))

  detached.stage()
  navigation.commit({ to: route, from })
  await flushPromises()

  expect(onResponse).toHaveBeenCalledExactlyOnceWith({
    response: { status: 'PUSH', to: ['/next', { replace: true }] },
    to: route,
    from,
  })
})

test('discarded prefetch redirects do not affect the next navigation', async () => {
  const prefetched = createResolvedRoute(createRoute({ path: '/prefetched' })
    .addLoader((_route, { push }) => push('/old')))
  const target = createResolvedRoute(createRoute({ path: '/target' }).addLoader(() => 'value'))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const detached = navigation.create()

  await Promise.allSettled(detached.compute(prefetched, getComputations(prefetched)))
  detached.dispose()
  await Promise.all(navigation.commit({ to: target, from: null }))
  await flushPromises()

  expect(onResponse).not.toHaveBeenCalled()
  await expect(navigation.getValue(loaderLocations(target.matches[0])[0], target)).resolves.toBe('value')
})

test('a loader started after commit reports its redirect', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const loaderRoute = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { push }) => push('/target')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const current = navigation.current()

  current.commit({ to: route, from: null })
  current.compute(route, getComputations(loaderRoute))
  await flushPromises()

  expect(onResponse).toHaveBeenCalledExactlyOnceWith({
    response: { status: 'PUSH', to: ['/target'] },
    to: route,
    from: null,
  })
})

test('stopping aborts current and staged computations and settles their readers', async () => {
  const signals: AbortSignal[] = []
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { signal }) => {
    signals.push(signal)

    return new Promise(() => {})
  }))
  const navigation = createRouterNavigation()
  const current = navigation.current()
  const staged = navigation.staged()
  const [currentValue] = current.compute(route, getComputations(route))
  const [stagedValue] = staged.compute(route, getComputations(route))

  navigation.stop()

  expect(signals).toHaveLength(2)
  expect(signals.every((signal) => signal.aborted)).toBe(true)
  await expect(currentValue).rejects.toBeInstanceOf(NavigationAbandonedError)
  await expect(stagedValue).rejects.toBeInstanceOf(NavigationAbandonedError)
})

test('an unexpected error waits for commit without preventing a later redirect', async () => {
  const error = new Error('failed loader')
  const pending = Promise.withResolvers<void>()
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => {
      throw error
    }, { name: 'broken' })
    .addLoader(async (_route, { push }) => {
      await pending.promise
      push('/next')
    }, { name: 'later' }))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const instance = navigation.staged()
  instance.compute(route, getComputations(route))
  await flushPromises()
  expect(onResponse).not.toHaveBeenCalled()

  instance.commit({ to: route, from: null })
  await flushPromises()
  expect(onResponse).toHaveBeenCalledExactlyOnceWith({
    response: { status: 'ERROR', error, source: 'loader' },
    to: route,
    from: null,
  })

  pending.resolve()
  await flushPromises()
  expect(onResponse).toHaveBeenCalledTimes(2)
  expect(onResponse).toHaveBeenLastCalledWith({
    response: { status: 'PUSH', to: ['/next'] },
    to: route,
    from: null,
  })
})

test('disposing a committed navigation prevents delivery of its settled redirect', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { push }) => push('/next')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const instance = navigation.staged()

  instance.commit({ to: route, from: null })
  instance.dispose()
  await flushPromises()

  expect(onResponse).not.toHaveBeenCalled()
})

test('a redirect abandons running loaders without a response handler', async () => {
  const ready = Promise.withResolvers<void>()
  const pending = Promise.withResolvers<string>()
  const started = Promise.withResolvers<AbortSignal>()
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(async (_route, { push }) => {
      await ready.promise
      push('/next')
    }, { name: 'redirect' })
    .addLoader((_route, { signal }) => {
      started.resolve(signal)
      return pending.promise
    }, { name: 'pending' }))
  const navigation = createRouterNavigation()
  const current = navigation.create()
  const [redirect, value] = current.commit({ to: route, from: null })
  const signal = await started.promise

  expect(signal.aborted).toBe(false)
  ready.resolve()

  await expect(redirect).resolves.toEqual({ status: 'PUSH', to: ['/next'] })
  await expect(value).rejects.toBeInstanceOf(NavigationAbandonedError)
  expect(signal.aborted).toBe(true)
})

test('reads after stop report abandonment', async () => {
  const route = createRoute({ name: 'home', path: '/' }).addLoader(() => 'loaded')
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()
  const current = navigation.create()
  await Promise.all(current.commit({ to: resolved, from: null }))
  const [location] = loaderLocations(resolved.matched)

  navigation.stop()

  expect(navigation.getState(location, resolved)).toEqual({
    status: 'ABANDONED',
  })
  await expect(navigation.getValue(location, resolved)).rejects.toBeInstanceOf(NavigationAbandonedError)
})

test('settled loader values remain readable after abandonment', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'kept'))
  const navigation = createRouterNavigation()
  const current = navigation.create()
  await Promise.all(current.commit({ to: route, from: null }))
  const [location] = loaderLocations(route.matched)
  current.abandon()

  expect(navigation.getState(location, route)).toEqual({ status: 'SUCCESS', value: 'kept' })
  await expect(navigation.getValue(location, route)).resolves.toBe('kept')
})

test.each(['push', 'reject'] as const)('a loader %s unwinds callback dependencies without reporting errors', async (action) => {
  const gate = Promise.withResolvers<void>()
  const cleaned = vi.fn()
  const continued = vi.fn()
  const caught: unknown[] = []
  const onResponse = vi.fn()
  const parent = createRoute({ path: '/' }).addLoader(async (_route, context) => {
    await gate.promise

    if (action === 'push') {
      context.push('/next')
    } else {
      context.reject('NotFound')
    }
  }, { name: 'base' })
    .addView(component, {
      props: async (route) => {
        try {
          await route.getData('base')
          continued()
        } catch (error) {
          caught.push(error)
          throw error
        } finally {
          cleaned('route.getData()')
        }
      },
    })
  const child = createRoute({ parent, path: 'child' }).addLoader(async (_route, { parent }) => {
    try {
      await parent.getData('base')
      continued()
    } finally {
      cleaned('parent.getData()')
    }
  }, { name: 'child' })
    .addView(component, {
      props: async (_route, { parent }) => {
        try {
          await parent.getProps()
          continued()
        } finally {
          cleaned('parent.getProps()')
        }
      },
    })
  const route = createResolvedRoute(child)
  const navigation = createRouterNavigation({ onResponse })
  navigation.commit({ to: route, from: null })
  gate.resolve()
  await flushPromises()

  expect(cleaned).toHaveBeenCalledTimes(3)
  expect(continued).not.toHaveBeenCalled()
  expect(caught).toEqual([expect.any(NavigationAbandonedError)])
  expect(onResponse).toHaveBeenCalledTimes(1)
  expect(onResponse.mock.calls[0][0].response.status).toBe(action === 'push' ? 'PUSH' : 'REJECT')
})

test('discarding a prefetch unwinds a callback even while the current store has no parent value', async () => {
  const cleaned = vi.fn()
  const parent = createRoute({ path: '/' }).addView(component, { props: () => new Promise(() => {}) })
  const child = createRoute({ parent, path: 'child' }).addView(component, {
    props: async (_route, { parent }) => {
      try {
        await parent.getProps()
      } finally {
        cleaned()
      }
    },
  })
  const route = createResolvedRoute(child)
  const navigation = createRouterNavigation()
  const prefetch = navigation.create()
  const values = prefetch.compute(route, getComputations(route))

  prefetch.dispose()
  await Promise.allSettled(values)
  await flushPromises()

  expect(cleaned).toHaveBeenCalledTimes(1)
})

test('state, responses, and values use locations for both props and loaders', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: () => ({ value: 'props' }) }))
  const navigation = createRouterNavigation()
  await Promise.all(navigation.commit({ to: route, from: null }))
  const loader = { kind: 'loader', id: route.id, name: 'default' } as const
  const props = { kind: 'props', id: route.id, name: 'default' } as const

  expect(navigation.getState(loader, route)).toEqual({ status: 'SUCCESS', value: 'loaded' })
  expect(navigation.getState(props, route)).toEqual({ status: 'SUCCESS', value: { value: 'props' } })
  await expect(navigation.subscribe(loader, route)).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
  await expect(navigation.subscribe(props, route)).resolves.toEqual({ status: 'SUCCESS', value: { value: 'props' } })
  await expect(navigation.getValue(loader, route)).resolves.toBe('loaded')
  await expect(navigation.getValue(props, route)).resolves.toEqual({ value: 'props' })
  expect(navigation.getValues(route, 'loader')).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'loaded' }])
  expect(navigation.getValues(route, 'props')).toEqual([{ kind: 'props', depth: 0, name: 'default', value: { value: 'props' } }])
  navigation.stop()
})

test('computation subscriptions prefer their local navigation over an older committed value', async () => {
  let value = Promise.resolve('original')
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => value)
    .addView(component, { props: () => ({}) }))
  const loader = loaderLocations(route.matched)[0]
  const computations = getComputations(route).map((computation) => {
    if (computation.kind === 'props') {
      return { ...computation, run: ({ subscribe }: ComputationContext) => subscribe(loader) }
    }

    return computation
  })
  const navigation = createRouterNavigation()
  const initial = navigation.create()
  await Promise.all(initial.compute(route, computations))
  initial.commit({ to: route, from: null })
  const pending = Promise.withResolvers<string>()
  value = pending.promise
  const prepared = navigation.create()
  const work = prepared.compute(route, computations)

  expect(prepared.getState(loader, route).status).toBe('RUNNING')
  expect(navigation.getState(loader, route)).toEqual({ status: 'SUCCESS', value: 'original' })
  pending.resolve('updated')
  await Promise.all(work)
  await Promise.all(prepared.commit({ to: route, from: route }))

  await expect(navigation.getValue({ kind: 'props', id: route.id, name: 'default' }, route)).resolves.toEqual({ status: 'SUCCESS', value: 'updated' })
  navigation.stop()
})

test('computation subscriptions preserve errors from a committed fallback source', async () => {
  const error = new Error('dependency failed')
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => {
      throw error
    })
    .addView(component, { props: () => ({}) }))
  const navigation = createRouterNavigation()
  await Promise.all(navigation.commit({ to: route, from: null }))
  const prepared = navigation.create()
  const loader = loaderLocations(route.matched)[0]
  const computations = getComputations(route).filter(({ kind }) => kind === 'props')
    .map((computation) => ({
      ...computation,
      run: ({ subscribe }: ComputationContext) => subscribe(loader),
    }))
  await Promise.all(prepared.compute(route, computations))

  await expect(prepared.getValue({ kind: 'props', id: route.id, name: 'default' }, route)).resolves.toEqual({ status: 'ERROR', source: 'loader', error })
  prepared.dispose()
  navigation.stop()
})
