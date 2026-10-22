import { afterEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { getComputations } from '@/services/getComputations'
import { ContextPushError } from '@/errors/contextPushError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

afterEach(() => {
  vi.restoreAllMocks()
})

test('pending props report abandonment when another navigation replaces their navigation', async () => {
  const pending = Promise.withResolvers<{ value: string }>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component, { props: () => pending.promise })
  const other = createRoute({ name: 'other', path: '/other' })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved })
  const props = navigation.getProps(route.id, 'default', resolved)

  navigation.commit({ to: createResolvedRoute(other) })

  await expect(props).resolves.toEqual({ kind: 'abandoned' })
  pending.resolve({ value: 'late' })
})

test('a rejected props getter reports an error before and after it settles', async () => {
  const error = new Error('props failed')
  const pending = Promise.withResolvers<{ value: string }>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component, { props: () => pending.promise })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved })
  const props = navigation.getProps(route.id, 'default', resolved)
  pending.reject(error)

  await expect(props).resolves.toEqual({ kind: 'error', error })
  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'error', error })
})

test('a props getter that throws NavigationAbandonedError reports abandonment', () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component, {
    props: () => {
      throw new NavigationAbandonedError()
    },
  })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'abandoned' })
})

test('a view without a props getter reports a successful value with no props', () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: undefined })
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
  navigation.commit({ to: resolved })

  await expect(navigation.getData(resolved)).resolves.toBe('staged')
  expect(loader).not.toHaveBeenCalled()
})

test('getValues returns the values the navigation resolved', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => 'value')
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved })
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
  navigation.commit({ to: resolved })

  await expect(navigation.getData(resolved)).resolves.toBe('value')
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

  navigation.commit({ to: currentResolved })
  await flushPromises()

  navigation.staged().compute(nextResolved, getComputations(nextResolved))

  expect(navigation.getValues(currentResolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'current' }])
})

test('a staged props getter can await a later loader without warnings', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const route = createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: async (route) => ({ value: await route.data }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const staged = navigation.staged()
  const computations = getComputations(resolved)
  const values = staged.compute(resolved, computations)

  await Promise.all(values)
  navigation.commit({ to: resolved })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: { value: 'loaded' } })
  expect(warn).not.toHaveBeenCalled()
})

test('a detached navigation whose getter throws does not surface an unhandled rejection when nothing waits on it', async () => {
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
  navigation.commit({ to: resolved })

  const signal = await seen.promise

  expect(signal.aborted).toBe(false)

  navigation.commit({ to: createResolvedRoute(other) })

  expect(signal.aborted).toBe(true)
})

test('a prefetched response is reported when its navigation becomes current', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader((_route, { replace }) => replace('/next')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const detached = navigation.create()

  await Promise.allSettled(detached.compute(route, getComputations(route)))

  expect(onResponse).not.toHaveBeenCalled()
  const from = createResolvedRoute(createRoute({ path: '/previous' }))
  const { signal } = new AbortController()

  detached.stage()
  navigation.commit({
    to: route,
    from,
    signal,
  })

  expect(onResponse).toHaveBeenCalledOnce()

  const [event] = onResponse.mock.calls[0]

  expect(event).toMatchObject({ to: route, from })
  expect(event.signal.aborted).toBe(false)

  await expect(event.response).resolves.toEqual({ status: 'PUSH', to: ['/next', { replace: true }] })
})

test('replacing a navigation discards its buffered responses', async () => {
  const load = vi.fn(() => 'value').mockImplementationOnce(() => {
    throw new ContextPushError(['/old'])
  })
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const detached = navigation.create()

  await Promise.allSettled(detached.compute(route, getComputations(route)))
  detached.dispose()
  navigation.create().stage()
  navigation.commit({ to: route })

  expect(onResponse).toHaveBeenCalledOnce()

  const [event] = onResponse.mock.calls[0]

  await expect(event.response).resolves.toEqual({ status: 'SUCCESS' })
})

test('computations added after adoption report their response once', async () => {
  const initial = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'initial'))
  const next = createResolvedRoute(createRoute({ path: '/next' }).addLoader((_route, { push }) => push('/target')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const current = navigation.staged()
  await Promise.all(navigation.commit({ to: initial }))
  onResponse.mockClear()

  current.compute(next, getComputations(next))
  current.compute(next, getComputations(next))

  expect(onResponse).toHaveBeenCalledOnce()
  const [event] = onResponse.mock.calls[0]

  expect(event.source).toBe('loader')
  await expect(event.response).resolves.toEqual({ status: 'PUSH', to: ['/target'] })
})

test('stop abandons computations in both current and staged navigations', async () => {
  const pending = Promise.withResolvers<string>()
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => pending.promise))
  const navigation = createRouterNavigation()
  const current = navigation.commit({ to: route })
  const staged = navigation.staged().compute(route, getComputations(route))

  navigation.stop()

  await expect(current[0]).rejects.toBeInstanceOf(NavigationAbandonedError)
  await expect(staged[0]).rejects.toBeInstanceOf(NavigationAbandonedError)
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
  await Promise.all(instance.commit({ to: route }))
  instance.stage()
  await Promise.all(instance.commit({ to: route }))

  expect(signal.aborted).toBe(false)
  expect(load).toHaveBeenCalledOnce()
  await expect(navigation.getData(route)).resolves.toBe(signal)
})

test('staging another instance keeps the current navigation active', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await Promise.all(instance.commit({ to: route }))
  const signal = load.mock.results[0].value

  instance.stage()
  navigation.create().stage()

  expect(signal.aborted).toBe(false)
  await Promise.all(navigation.commit({ to: route }))
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

  expect(current.data.get(computation.key)).toEqual({ kind: 'running' })
  expect(run).toHaveBeenCalledOnce()
  expect(attached).not.toHaveBeenCalled()

  pending.resolve('loaded')
  await expect(values[0]).resolves.toBe('loaded')
})

test('a redirect abandons unfinished computations without a response handler', async () => {
  const pending = Promise.withResolvers<string>()
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader((_route, { push }) => push('/next'), { name: 'redirect' })
    .addLoader(() => pending.promise, { name: 'pending' }))
  const navigation = createRouterNavigation()

  const values = navigation.commit({ to: route })

  await expect(values[1]).rejects.toBeInstanceOf(NavigationAbandonedError)
  expect(navigation.current().data.signal.aborted).toBe(true)
})

test('an unexpected error leaves other computations running', async () => {
  const pending = Promise.withResolvers<string>()
  const error = new Error('failed')
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => {
      throw error
    }, { name: 'failed' })
    .addLoader(() => pending.promise, { name: 'pending' }))
  const navigation = createRouterNavigation()

  const values = navigation.commit({ to: route })

  await expect(values[0]).rejects.toBe(error)
  expect(navigation.current().data.signal.aborted).toBe(false)
  pending.resolve('value')
  await expect(values[1]).resolves.toBe('value')
})
