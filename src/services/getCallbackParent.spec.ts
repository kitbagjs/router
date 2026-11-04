import { afterEach, assert, expect, test, vi } from 'vitest'
import { getCallbackParent } from '@/services/getCallbackParent'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { component } from '@/utilities/testHelpers'
import * as legacyValues from '@/utilities/toLegacyValues'

afterEach(() => {
  vi.restoreAllMocks()
})

test('parent data includes ancestors and excludes child loaders', async () => {
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
  expect(() => Reflect.apply(result.getData, undefined, ['child'])).toThrow(TypeError)
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', depth: 0, name: 'ancestor' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', depth: 1, name: 'count' })
})

test('parent props select getters only from the immediate parent', async () => {
  const root = createRoute({ path: '/' }).addView(component, { name: 'ancestor', props: () => ({}) })
  const parent = createRoute({ parent: root, path: 'parent' }).addView(component, { props: () => ({}) })
    .addView(component, { name: 'summary', props: () => ({}) })
    .addView(component, { name: 'empty' })
  const child = createRoute({ parent, path: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn().mockResolvedValue('value')
  const result = getCallbackParent(2, { to, getValue })

  assert(result)

  expect(getValue).not.toHaveBeenCalled()

  await result.getProps()
  await result.getProps('summary')
  for (const name of ['empty', 'ancestor']) {
    expect(() => Reflect.apply(result.getProps, undefined, [name])).toThrow(TypeError)
  }
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'props', depth: 1, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'props', depth: 1, name: 'summary' })
})

test.each([0, -1])('has no parent at depth %s', (depth) => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const result = getCallbackParent(depth, { to, getValue: vi.fn() })

  expect(result).toBeUndefined()
})

test('parent getters preserve reader failures', async () => {
  const error = new Error('reader failed')
  const parent = createRoute({ path: '/' }).addLoader(() => 'data')
    .addView(component, { props: () => ({}) })
  const child = createRoute({ parent, path: 'child' })
  const to = createResolvedRoute(child)
  const getValue = vi.fn().mockRejectedValue(error)
  const result = getCallbackParent(1, { to, getValue })

  assert(result)

  await expect(result.getData()).rejects.toBe(error)
  await expect(result.getProps()).rejects.toBe(error)
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
