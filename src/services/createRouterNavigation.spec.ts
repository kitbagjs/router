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

  const instance = navigation.create()
  instance.commit({ to: resolved })
  const props = navigation.getProps(route.id, 'default', resolved)

  const replacement = navigation.create()
  replacement.commit({ to: createResolvedRoute(other) })

  await expect(props).resolves.toEqual({ kind: 'abandoned' })
  pending.resolve({ value: 'late' })
})

test('a rejected props getter reports an error before and after it settles', async () => {
  const error = new Error('props failed')
  const pending = Promise.withResolvers<{ value: string }>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component, { props: () => pending.promise })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const instance = navigation.create()
  instance.commit({ to: resolved })
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

  const instance = navigation.create()
  instance.commit({ to: resolved })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'abandoned' })
})

test('a view without a props getter reports a successful value with no props', () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const instance = navigation.create()
  instance.commit({ to: resolved })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: undefined })
})

test('filled values are adopted in place of running their getters', async () => {
  const loader = vi.fn(() => 'computed')
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(loader)
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const detached = navigation.create()

  detached.fill(resolved, [{ kind: 'loader', depth: 0, name: 'default', value: 'staged' }])
  detached.commit({ to: resolved })

  await expect(navigation.getData(resolved)).resolves.toBe('staged')
  expect(loader).not.toHaveBeenCalled()
})

test('getValues returns the values the navigation resolved', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => 'value')
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const instance = navigation.create()
  instance.commit({ to: resolved })
  await flushPromises()

  expect(navigation.getValues(resolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'value' }])
})

test('prepared values are retained when their navigation is committed', async () => {
  const loader = vi.fn(() => 'value')
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(loader)
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const prepared = navigation.create()
  await Promise.all(prepared.compute(resolved, getComputations(resolved)))
  prepared.commit({ to: resolved })

  await expect(navigation.getData(resolved)).resolves.toBe('value')
  expect(loader).toHaveBeenCalledTimes(1)
})

test('preparing another navigation leaves the current route reading its own values', async () => {
  const current = createRoute({ name: 'current', path: '/current' }).addView(component)
    .addLoader(() => 'current')
  const next = createRoute({ name: 'next', path: '/next' }).addView(component)
    .addLoader(() => 'next')
  const navigation = createRouterNavigation()
  const currentResolved = createResolvedRoute(current)
  const nextResolved = createResolvedRoute(next)

  const committed = navigation.create()
  committed.commit({ to: currentResolved })
  await flushPromises()

  const prepared = navigation.create()
  prepared.compute(nextResolved, getComputations(nextResolved))

  expect(navigation.getValues(currentResolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'current' }])
})

test('a prepared props getter can await a later loader without warnings', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const route = createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: async (route) => ({ value: await route.data }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  const prepared = navigation.create()
  const computations = getComputations(resolved)
  const values = prepared.compute(resolved, computations)

  await Promise.all(values)
  prepared.commit({ to: resolved })

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

test('a prepared getter keeps its signal until its committed navigation is replaced', async () => {
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
  detached.commit({ to: resolved })

  const signal = await seen.promise

  expect(signal.aborted).toBe(false)

  const replacement = navigation.create()
  replacement.commit({ to: createResolvedRoute(other) })

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

  detached.commit({
    to: route,
    from,
  })

  expect(onResponse).toHaveBeenCalledOnce()

  const [event] = onResponse.mock.calls[0]

  expect(event).toMatchObject({ to: route, from, signal: detached.data.signal })

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
  const replacement = navigation.create()
  replacement.commit({ to: route })

  expect(onResponse).toHaveBeenCalledOnce()

  const [event] = onResponse.mock.calls[0]

  await expect(event.response).resolves.toEqual({ status: 'SUCCESS' })
})

test('computations added after adoption report their response once', async () => {
  const initial = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'initial'))
  const next = createResolvedRoute(createRoute({ path: '/next' }).addLoader((_route, { push }) => push('/target')))
  const onResponse = vi.fn()
  const navigation = createRouterNavigation({ onResponse })
  const current = navigation.create()
  await Promise.all(current.commit({ to: initial }))
  onResponse.mockClear()

  current.compute(initial, getComputations(next))
  current.compute(initial, getComputations(next))

  expect(onResponse).toHaveBeenCalledOnce()
  const [event] = onResponse.mock.calls[0]

  expect(event.source).toBe('loader')
  await expect(event.response).resolves.toEqual({ status: 'PUSH', to: ['/target'] })
})

test('committing the same instance preserves its computations', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await Promise.all(instance.compute(route, getComputations(route)))
  const signal = load.mock.results[0].value

  await Promise.all(instance.commit({ to: route }))
  await Promise.all(instance.commit({ to: route }))

  expect(signal.aborted).toBe(false)
  expect(load).toHaveBeenCalledOnce()
  await expect(navigation.getData(route)).resolves.toBe(signal)
})

test('preparing another instance keeps the current navigation active', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await Promise.all(instance.commit({ to: route }))
  const signal = load.mock.results[0].value

  const replacement = navigation.create()
  replacement.compute(route, getComputations(route))

  expect(signal.aborted).toBe(false)
  await Promise.all(replacement.commit({ to: route }))
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
