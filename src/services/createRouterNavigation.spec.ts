import { expect, test } from 'vitest'
import { createRouterNavigation } from './createRouterNavigation'
import { createResolvedRoute } from './createResolvedRoute'
import { createRoute } from './createRoute'

test('creates one store per resolved route instance, including repeat visits to the same url', () => {
  const navigation = createRouterNavigation()
  const definition = createRoute({ path: '/' })
  const first = createResolvedRoute(definition)
  const second = createResolvedRoute(definition)
  const store = navigation.get(first)
  store.setEntries([{ key: 'value', value: { status: 'SUCCESS', value: 'first' } }])

  expect(navigation.get(first)).toBe(store)
  expect(navigation.get(second)).not.toBe(store)
  expect(navigation.get(second).getState('value')).toEqual({ status: 'MISSING' })
})

test('adopts a prepared store without copying its entries', async () => {
  const navigation = createRouterNavigation()
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const prepared = navigation.create()
  const waiting = prepared.getValue('value')
  navigation.set(route, prepared)
  navigation.get(route).setEntries([{ key: 'value', value: { status: 'SUCCESS', value: 'adopted' } }])

  expect(navigation.get(route)).toBe(prepared)
  await expect(waiting).resolves.toBe('adopted')
})

test('abandonment retains the association and settled data', async () => {
  const navigation = createRouterNavigation()
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const store = navigation.get(route)
  store.setEntries([{ key: 'value', value: { status: 'SUCCESS', value: 'retained' } }])
  navigation.abandon(route)

  expect(navigation.get(route)).toBe(store)
  await expect(store.getValue('value')).resolves.toBe('retained')
  await expect(store.getValue('missing')).rejects.toThrow()
})

test('abandoning an unknown route does not create a store', () => {
  const navigation = createRouterNavigation()
  const route = createResolvedRoute(createRoute({ path: '/' }))
  navigation.abandon(route)

  expect(navigation.get(route).getState('value')).toEqual({ status: 'MISSING' })
})
