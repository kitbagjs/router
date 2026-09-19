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
