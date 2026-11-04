import { ValueLocation } from '@/types/computation'
import { assert, expect, test, vi } from 'vitest'
import { toLegacyValues } from '@/utilities/toLegacyValues'

test('no locations have no legacy value and do not read', () => {
  const getValue = vi.fn()

  expect(toLegacyValues([], getValue)).toBeUndefined()
  expect(getValue).not.toHaveBeenCalled()
})

test('a single default location returns its promise directly', () => {
  const value = Promise.resolve('default')
  const getValue = vi.fn().mockReturnValue(value)
  const location = { kind: 'loader', depth: 0, name: 'default' } as const

  expect(toLegacyValues([location], getValue)).toBe(value)
  expect(getValue).toHaveBeenCalledExactlyOnceWith(location)
})

test.each([
  { names: ['count'] },
  { names: ['default', 'count'] },
])('named locations $names produce a lazy record', async ({ names }) => {
  const locations = names.map((name): ValueLocation => ({ kind: 'loader', depth: 0, name }))
  const getValue = vi.fn((location: ValueLocation) => Promise.resolve(location.name))
  const values = toLegacyValues(locations, getValue)
  assert(values && !(values instanceof Promise))

  expect(Object.keys(values)).toEqual(names)
  expect('count' in values).toBe(true)
  expect(getValue).not.toHaveBeenCalled()
  await expect(values.count).resolves.toBe('count')
  expect(getValue).toHaveBeenCalledExactlyOnceWith({ kind: 'loader', depth: 0, name: 'count' })
  getValue.mockResolvedValue('updated')
  await expect(values.count).resolves.toBe('updated')
})
