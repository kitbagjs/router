import { afterEach, expect, test, vi } from 'vitest'
import { createCallbackRoute } from '@/services/createCallbackRoute'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import * as legacyValues from '@/utilities/toLegacyValues'

afterEach(() => {
  vi.restoreAllMocks()
})

test('getData selects default and named loader locations on demand', async () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'default')
    .addLoader(() => 42, { name: 'count' })
  const to = createResolvedRoute(definition)
  const getValue = vi.fn().mockResolvedValue('value')
  const route = createCallbackRoute({ to, getValue })

  expect(getValue).not.toHaveBeenCalled()
  await route.getData()
  await route.getData('count')
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', depth: 0, name: 'count' })
})

test('legacy data delegates locations and the reader to the legacy adapter', () => {
  const adapt = vi.spyOn(legacyValues, 'toLegacyValues').mockReturnValue(undefined)
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent')
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn()
  const route = createCallbackRoute({ to, getValue })

  expect(adapt).not.toHaveBeenCalled()
  Reflect.get(route, 'data')
  expect(adapt).toHaveBeenCalledWith([
    { kind: 'loader', depth: 0, name: 'default' },
    { kind: 'loader', depth: 1, name: 'child' },
  ], getValue)
  expect(getValue).not.toHaveBeenCalled()
})
