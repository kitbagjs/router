import { flushPromises } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getRouteData } from '@/services/getRouteData'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { component } from '@/utilities/testHelpers'

test('route data requests loader locations from the navigation value reader', async () => {
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent', { name: 'parent' })
  const route = createResolvedRoute(createRoute({ parent, path: 'child' })
    .addLoader(() => 'child')
    .addView(component, { props: () => ({ value: 'props' }) }))
  const values = { parent: Promise.resolve('loaded') }
  const getValues = vi.fn().mockReturnValue(values)
  const data = getRouteData({ getValues }, route)

  expect(getValues).toHaveBeenCalledExactlyOnceWith([
    expect.objectContaining({ kind: 'loader', id: parent.id, name: 'parent' }),
    expect.objectContaining({ kind: 'loader', id: route.id, name: 'default' }),
  ], route)
  await expect(data.parent).resolves.toBe('loaded')
})

test('route data forwards value reader errors', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'value'))
  const error = new Error('failed')
  const getValues = vi.fn().mockReturnValue({ default: Promise.reject(error) })
  const values = getRouteData({ getValues }, route)

  await expect(values.default).rejects.toBe(error)
})

test.each(['property', 'descriptor'] as const)('route data keeps abandoned %s reads pending for component rendering', async (read) => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'value'))
  const getValues = vi.fn().mockReturnValue({ default: Promise.reject(new NavigationAbandonedError()) })
  const values = getRouteData({ getValues }, route)
  const settled = vi.fn()

  let value: Promise<unknown>

  if (read === 'descriptor') {
    value = Object.getOwnPropertyDescriptor(values, 'default')?.value
  } else {
    value = values.default
  }

  value.then(settled, settled)
  await flushPromises()

  expect(settled).not.toHaveBeenCalled()
})
