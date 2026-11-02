import { flushPromises } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getRouteData } from '@/services/getRouteData'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { component } from '@/utilities/testHelpers'

test('route data selects loaders and subscribes only when their values are read', async () => {
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent', { name: 'parent' })
  const route = createResolvedRoute(createRoute({ parent, path: 'child' })
    .addLoader(() => 'child')
    .addView(component, { props: () => ({ value: 'props' }) }))
  const subscribe = vi.fn().mockResolvedValue({ status: 'SUCCESS', value: 'loaded' })
  const values = getRouteData({ subscribe }, route)

  expect(Object.getOwnPropertyNames(values)).toEqual(['parent', 'default'])
  expect(subscribe).not.toHaveBeenCalled()
  await expect(values.parent).resolves.toBe('loaded')
  expect(subscribe).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ kind: 'loader', id: parent.id, name: 'parent' }), route)
})

test('route data forwards callback errors', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'value'))
  const error = new Error('failed')
  const subscribe = vi.fn().mockResolvedValue({ status: 'ERROR', source: 'loader', error })
  const values = getRouteData({ subscribe }, route)

  await expect(values.default).rejects.toBe(error)
})

test('route data keeps abandoned reads pending for component rendering', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'value'))
  const subscribe = vi.fn().mockRejectedValue(new NavigationAbandonedError())
  const values = getRouteData({ subscribe }, route)
  const settled = vi.fn()

  values.default.then(settled, settled)
  await flushPromises()

  expect(settled).not.toHaveBeenCalled()
})
