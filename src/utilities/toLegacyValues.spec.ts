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
