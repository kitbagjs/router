import { flushPromises } from '@vue/test-utils'
import { assert, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getRouteData } from '@/services/getRouteData'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { component } from '@/utilities/testHelpers'

test('legacy route data reads only the selected loader through navigation', async () => {
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent', { name: 'parent' })
  const route = createResolvedRoute(createRoute({ parent, path: 'child' })
    .addLoader(() => 'child')
    .addView(component, { props: () => ({ value: 'props' }) }))
  const getValue = vi.fn().mockResolvedValue('loaded')
  const data = getRouteData({ getValue }, route)
  assert(data && !(data instanceof Promise))

  expect(Object.keys(data)).toEqual(['parent', 'default'])
  expect(getValue).not.toHaveBeenCalled()
  await expect(data.parent).resolves.toBe('loaded')
  expect(getValue).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ kind: 'loader', depth: 0, name: 'parent' }), route)
})

test('route data forwards value reader errors', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'value'))
  const error = new Error('failed')
  const getValue = vi.fn().mockRejectedValue(error)

  await expect(getRouteData({ getValue }, route)).rejects.toBe(error)
})

test('route data keeps abandoned reads pending for component rendering', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'value'))
  const getValue = vi.fn().mockRejectedValue(new NavigationAbandonedError())
  const value = getRouteData({ getValue }, route)
  const settled = vi.fn()

  Promise.resolve(value).then(settled, settled)
  await flushPromises()

  expect(settled).not.toHaveBeenCalled()
})
