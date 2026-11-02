import { expect, test, vi } from 'vitest'
import { DataRecord } from '@/types/data'
import { toLegacyValues } from '@/utilities/toLegacyValues'

test('adapting named legacy values does not read their property descriptors', () => {
  const descriptor = vi.fn(Reflect.getOwnPropertyDescriptor)
  const values = new Proxy<DataRecord>({
    first: Promise.resolve('first'),
    second: Promise.resolve('second'),
  }, { getOwnPropertyDescriptor: descriptor })

  expect(toLegacyValues(values)).toBe(values)
  expect(descriptor).not.toHaveBeenCalled()
})

test('empty records have no legacy value', () => {
  expect(toLegacyValues({})).toBeUndefined()
})

test('a single default loader keeps its promise as the legacy value', () => {
  const value = Promise.resolve('default')

  expect(toLegacyValues({ default: value })).toBe(value)
})

test('named loaders retain the record even when a default loader is present', () => {
  const values = {
    default: Promise.resolve('default'),
    count: Promise.resolve(42),
  }

  expect(toLegacyValues(values)).toBe(values)
})
