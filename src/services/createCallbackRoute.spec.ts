import { afterEach, expect, test, vi } from 'vitest'
import { createCallbackRoute } from '@/services/createCallbackRoute'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { isResolvedRoute } from '@/types/resolved'
import * as legacyValues from '@/utilities/toLegacyValues'

afterEach(() => {
  vi.restoreAllMocks()
})

test('route data selects default and named loaders lazily', async () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'default')
    .addLoader(() => 42, { name: 'count' })
  const to = createResolvedRoute(definition)
  const getValue = vi.fn().mockResolvedValue('value')
  const route = createCallbackRoute({ to, getValue })

  expect(getValue).not.toHaveBeenCalled()
  expect(route.href).toBe(to.href)
  expect(route.params).toBe(to.params)
  expect(route.matches).toBe(to.matches)
  expect(route.getParam).toBe(to.getParam)
  expect(isResolvedRoute(route)).toBe(true)
  await route.getData()
  await route.getData('default')
  await route.getData('count')
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', depth: 0, name: 'count' })
})

test('preserves reader failures', async () => {
  const error = new Error('reader failed')
  const to = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'data'))
  const getValue = vi.fn().mockRejectedValue(error)
  const route = createCallbackRoute({ to, getValue })

  await expect(route.getData()).rejects.toBe(error)
})

test('legacy data delegates locations and the reader to the legacy adapter', () => {
  const legacy = Promise.resolve('legacy')
  const adapt = vi.spyOn(legacyValues, 'toLegacyValues').mockReturnValue(legacy)
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent')
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn()
  const route = createCallbackRoute({ to, getValue })

  expect(adapt).not.toHaveBeenCalled()
  expect(Reflect.get(route, 'data')).toBe(legacy)
  expect(adapt).toHaveBeenCalledWith([
    { kind: 'loader', depth: 0, name: 'default' },
    { kind: 'loader', depth: 1, name: 'child' },
  ], getValue)
  expect(getValue).not.toHaveBeenCalled()
})
