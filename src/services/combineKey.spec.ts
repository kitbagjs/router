import { expect, test } from 'vitest'
import { combineKey } from '@/services/combineKey'

test('given 2 keys, returns keys joined together with period', () => {
  const aKey = 'foo'
  const bKey = 'bar'

  const response = combineKey(aKey, bKey)

  expect(response.toString()).toBe('foo.bar')
})

test.each(['', undefined])('given 1 key and one empty or undefined, returns first key only', (bKey) => {
  const aKey = 'foo'

  const response = combineKey(aKey, bKey)

  expect(response.toString()).toBe('foo')
})