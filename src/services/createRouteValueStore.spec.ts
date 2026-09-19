import { expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRouteValueStore } from '@/services/createRouteValueStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'

test('a prefilled value is adopted in place of running its getter', async () => {
  const loader = vi.fn(() => 'computed')
  const route = createRoute({ name: 'route', path: '/', component }).addLoader(loader)
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.prefill(resolved, [{ kind: 'loader', depth: 0, name: 'default', value: 'prefilled' }])
  store.setRouteValues(resolved)

  await expect(store.getData(resolved)).resolves.toBe('prefilled')
  expect(loader).not.toHaveBeenCalled()
})

test('getValues returns the values the store resolved', async () => {
  const route = createRoute({ name: 'route', path: '/', component }).addLoader(() => 'value')
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  store.setRouteValues(resolved)
  await flushPromises()

  expect(store.getValues(resolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'value' }])
})

test('staged values are adopted by the next navigation without running their getters again', async () => {
  const loader = vi.fn(() => 'value')
  const route = createRoute({ name: 'route', path: '/', component }).addLoader(loader)
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  await store.stageRouteValues(resolved).loaders
  store.setRouteValues(resolved)

  await expect(store.getData(resolved)).resolves.toBe('value')
  expect(loader).toHaveBeenCalledTimes(1)
})

test('staging a route leaves the current route reading its own values', async () => {
  const current = createRoute({ name: 'current', path: '/current', component }).addLoader(() => 'current')
  const next = createRoute({ name: 'next', path: '/next', component }).addLoader(() => 'next')
  const store = createRouteValueStore()
  const currentResolved = createResolvedRoute(current)

  store.setRouteValues(currentResolved)
  await flushPromises()

  store.stageRouteValues(createResolvedRoute(next))

  expect(store.getValues(currentResolved)).toEqual([{ kind: 'loader', depth: 0, name: 'default', value: 'current' }])
})

test('a staged props getter can read the data its route is loading', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'loaded')
    .addView(component, { props: async (route) => ({ value: await route.data }) })
  const resolved = createResolvedRoute(route)
  const store = createRouteValueStore()

  await store.stageRouteValues(resolved).props
  store.setRouteValues(resolved)

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

  const { props } = store.stageRouteValues(createResolvedRoute(route))

  await expect(props).resolves.toMatchObject({ status: 'REJECT', type: 'NotFound' })
})
