import { expect, test, vi } from 'vitest'
import { toValueRecord } from '@/services/toValueRecord'
import { ValueLocation } from '@/services/getComputations'

test('enumerates names without subscribing and resolves each property lazily', async () => {
  const locations: ValueLocation[] = [
    { kind: 'loader', id: 'parent', name: 'data' },
    { kind: 'props', id: 'child', name: 'sidebar' },
  ]
  const read = vi.fn().mockResolvedValue('value')
  const values = toValueRecord(locations, read)

  expect(Object.getOwnPropertyNames(values)).toEqual(['data', 'sidebar'])
  expect('data' in values).toBe(true)
  expect(read).not.toHaveBeenCalled()
  await expect(values.sidebar).resolves.toBe('value')
  expect(read).toHaveBeenCalledExactlyOnceWith(locations[1])
  expect(values.missing).toBeUndefined()
})

test('retained records use the reader again instead of caching an earlier value', async () => {
  const read = vi.fn().mockResolvedValueOnce('first')
    .mockResolvedValueOnce('second')
  const values = toValueRecord([{ kind: 'loader', id: 'route', name: 'default' }], read)

  await expect(values.default).resolves.toBe('first')
  await expect(values.default).resolves.toBe('second')
})
