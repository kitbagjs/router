import { expect, test } from 'vitest'
import { combineName } from '@/services/combineName'

test('given 2 names, returns names joined together with period', () => {
  const aName = 'foo'
  const bName = 'bar'

  const response = combineName(aName, bName)

  expect(response.toString()).toBe('foo.bar')
})

test.each(['', undefined])('given 1 name and one empty or undefined, returns first name only', (bName) => {
  const aName = 'foo'

  const response = combineName(aName, bName)

  expect(response.toString()).toBe('foo')
})