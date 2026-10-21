import { expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { ContextPushError } from '@/errors/contextPushError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

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

  await navigation.staged().compute(resolved).loaders
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

  navigation.commit({ to: currentResolved })
  await flushPromises()

  navigation.staged().compute(createResolvedRoute(next))

  expect(navigation.getValues(currentResolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'current' }])
})

test('a staged props getter can read the data its route is loading', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: async (route) => ({ value: await route.data }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  await navigation.staged().compute(resolved).props
  navigation.commit({ to: resolved })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: { value: 'loaded' } })
})

test('staging reports how the values settled', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addView(component, {
      props: (_route, { reject }) => {
        reject('NotFound')

        return {}
      },
    })
  const navigation = createRouterNavigation()

  const { props } = navigation.staged().compute(createResolvedRoute(route))

  await expect(props).resolves.toMatchObject({ status: 'REJECT', type: 'NotFound' })
})

test('a detached navigation whose getter throws does not surface an unhandled rejection when nothing waits on it', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => {
      throw new Error('getter failed')
    })
  const navigation = createRouterNavigation()
  const detached = navigation.create()

  detached.compute(createResolvedRoute(route))

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

  detached.compute(createResolvedRoute(route))

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

  detached.compute(resolved)
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

  await detached.compute(route).loaders

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

  expect(event).toMatchObject({ to: route, from, signal })

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

  await detached.compute(route).loaders
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
  await navigation.commit({ to: initial }).loaders
  onResponse.mockClear()

  current.compute(next)
  current.compute(next)

  expect(onResponse).toHaveBeenCalledOnce()
  const [event] = onResponse.mock.calls[0]

  expect(event.source).toBe('loader')
  await expect(event.response).resolves.toEqual({ status: 'PUSH', to: ['/target'] })
})

test('staging and committing the same instance preserves its computations', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await instance.compute(route).loaders
  const signal = load.mock.results[0].value

  instance.stage()
  instance.stage()
  await instance.commit({ to: route }).loaders
  instance.stage()
  await instance.commit({ to: route }).loaders

  expect(signal.aborted).toBe(false)
  expect(load).toHaveBeenCalledOnce()
  await expect(navigation.getData(route)).resolves.toBe(signal)
})

test('staging another instance keeps the current navigation active', async () => {
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => signal)
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(load))
  const navigation = createRouterNavigation()
  const instance = navigation.create()
  await instance.commit({ to: route }).loaders
  const signal = load.mock.results[0].value

  instance.stage()
  navigation.create().stage()

  expect(signal.aborted).toBe(false)
  await navigation.commit({ to: route }).loaders
  expect(signal.aborted).toBe(true)
})
