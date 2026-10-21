import { expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouteValueStore } from '@/services/createRouteValueStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

test('pending props report abandonment when another navigation replaces their store', async () => {
  const pending = Promise.withResolvers<{ value: string }>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component, { props: () => pending.promise })
  const other = createRoute({ name: 'other', path: '/other' })
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.commit(resolved)
  const props = store.getProps(route.id, 'default', resolved)

  store.commit(createResolvedRoute(other))

  await expect(props).resolves.toEqual({ kind: 'abandoned' })
  pending.resolve({ value: 'late' })
})

test('a rejected props getter reports an error before and after it settles', async () => {
  const error = new Error('props failed')
  const pending = Promise.withResolvers<{ value: string }>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component, { props: () => pending.promise })
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.commit(resolved)
  const props = store.getProps(route.id, 'default', resolved)
  pending.reject(error)

  await expect(props).resolves.toEqual({ kind: 'error', error })
  expect(store.getProps(route.id, 'default', resolved)).toEqual({ kind: 'error', error })
})

test('a props getter that throws NavigationAbandonedError reports abandonment', () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component, {
    props: () => {
      throw new NavigationAbandonedError()
    },
  })
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.commit(resolved)

  expect(store.getProps(route.id, 'default', resolved)).toEqual({ kind: 'abandoned' })
})

test('a view without a props getter reports a successful value with no props', () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.commit(resolved)

  expect(store.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: undefined })
})

test('a staged value is adopted in place of running its getter', async () => {
  const loader = vi.fn(() => 'computed')
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(loader)
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  const detached = store.createDetachedStore()

  detached.fill(resolved, [{ kind: 'loader', depth: 0, name: 'default', value: 'staged' }])
  detached.stage()
  store.commit(resolved)

  await expect(store.getData(resolved)).resolves.toBe('staged')
  expect(loader).not.toHaveBeenCalled()
})

test('getValues returns the values the store resolved', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => 'value')
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.commit(resolved)
  await flushPromises()

  expect(store.getValues(resolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'value' }])
})

test('staged values are adopted by the next navigation without running their getters again', async () => {
  const loader = vi.fn(() => 'value')
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(loader)
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  await store.staged().compute(resolved).loaders
  store.commit(resolved)

  await expect(store.getData(resolved)).resolves.toBe('value')
  expect(loader).toHaveBeenCalledTimes(1)
})

test('staging a route leaves the current route reading its own values', async () => {
  const current = createRoute({ name: 'current', path: '/current' }).addView(component)
    .addLoader(() => 'current')
  const next = createRoute({ name: 'next', path: '/next' }).addView(component)
    .addLoader(() => 'next')
  const store = createRouteValueStore()
  const currentResolved = createResolvedRoute(current)

  store.commit(currentResolved)
  await flushPromises()

  store.staged().compute(createResolvedRoute(next))

  expect(store.getValues(currentResolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'current' }])
})

test('a staged props getter can read the data its route is loading', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: async (route) => ({ value: await route.data }) })
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  await store.staged().compute(resolved).props
  store.commit(resolved)

  expect(store.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: { value: 'loaded' } })
})

test('staging reports how the values settled', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addView(component, {
      props: (_route, { reject }) => {
        reject('NotFound')

        return {}
      },
    })
  const store = createRouteValueStore()

  const { props } = store.staged().compute(createResolvedRoute(route))

  await expect(props).resolves.toMatchObject({ status: 'REJECT', type: 'NotFound' })
})

test('a detached store whose getter throws does not surface an unhandled rejection when nothing waits on it', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader(() => {
      throw new Error('getter failed')
    })
  const store = createRouteValueStore()
  const detached = store.createDetachedStore()

  detached.compute(createResolvedRoute(route))

  await flushPromises()
})

test('disposing a detached store aborts the signal its getters were given', async () => {
  const seen = Promise.withResolvers<AbortSignal>()
  const route = createRoute({ name: 'route', path: '/' }).addView(component)
    .addLoader((_route, { signal }) => {
      seen.resolve(signal)

      return 'value'
    })
  const store = createRouteValueStore()
  const detached = store.createDetachedStore()

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
  const store = createRouteValueStore()
  const detached = store.createDetachedStore()

  detached.compute(resolved)
  detached.stage()
  store.commit(resolved)

  const signal = await seen.promise

  expect(signal.aborted).toBe(false)

  store.commit(createResolvedRoute(other))

  expect(signal.aborted).toBe(true)
})
