import { afterEach, assert, expect, test, vi } from 'vitest'
import { getCallbackParent } from '@/services/getCallbackParent'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { component } from '@/utilities/testHelpers'
import * as legacyValues from '@/utilities/toLegacyValues'

afterEach(() => {
  vi.restoreAllMocks()
})

test('parent data resolves loaders at their owning ancestor depth', async () => {
  const root = createRoute({ path: '/' }).addLoader(() => 'default')
    .addLoader(() => 'ancestor', { name: 'ancestor' })
  const parent = createRoute({ parent: root, name: 'parent', path: 'parent' }).addLoader(() => 42, { name: 'count' })
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn().mockResolvedValue('value')
  const result = getCallbackParent(2, { to, getValue })

  assert(result)

  expect(getValue).not.toHaveBeenCalled()

  expect(result.name).toBe('parent')
  await result.getData()
  await result.getData('ancestor')
  await result.getData('count')
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', depth: 0, name: 'ancestor' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', depth: 1, name: 'count' })
})

test('parent props select getters only from the immediate parent', async () => {
  const root = createRoute({ path: '/' }).addView(component, { name: 'ancestor', props: () => ({}) })
  const parent = createRoute({ parent: root, path: 'parent' }).addView(component, { props: () => ({}) })
    .addView(component, { name: 'summary', props: () => ({}) })
  const child = createRoute({ parent, path: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn().mockResolvedValue('value')
  const result = getCallbackParent(2, { to, getValue })

  assert(result)

  expect(getValue).not.toHaveBeenCalled()

  await result.getProps()
  await result.getProps('summary')
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'props', depth: 1, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'props', depth: 1, name: 'summary' })
})

test.each([0, -1])('has no parent at depth %s', (depth) => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const result = getCallbackParent(depth, { to, getValue: vi.fn() })

  expect(result).toBeUndefined()
})

test('legacy getters delegate parent locations and the reader to the legacy adapter', () => {
  const legacy = Promise.resolve('legacy')
  const adapt = vi.spyOn(legacyValues, 'toLegacyValues').mockReturnValue(legacy)
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent')
    .addView(component, { props: () => ({}) })
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn()
  const result = getCallbackParent(1, { to, getValue })

  assert(result)

  expect(Reflect.get(result, 'data')).toBe(legacy)
  expect(Reflect.get(result, 'props')).toBe(legacy)
  expect(adapt).toHaveBeenNthCalledWith(1, [{ kind: 'loader', depth: 0, name: 'default' }], getValue)
  expect(adapt).toHaveBeenNthCalledWith(2, [{ kind: 'props', depth: 0, name: 'default' }], getValue)
  expect(getValue).not.toHaveBeenCalled()
})

test.each(['empty', 'ancestor'])('rejects parent props for %s without a getter on that match', (name) => {
  const root = createRoute({ path: '/' }).addView(component, { name: 'ancestor', props: () => ({}) })
  const parent = createRoute({ parent: root, path: 'parent' }).addView(component, { name: 'empty' })
  const to = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const getValue = vi.fn()
  const result = getCallbackParent(2, { to, getValue })

  assert(result)

  expect(() => result.getProps(name)).toThrow(TypeError)
  expect(getValue).not.toHaveBeenCalled()
})
