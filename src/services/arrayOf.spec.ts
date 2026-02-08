import { expect, test } from 'vitest'
import { arrayOf } from '@/services/arrayOf'
import { getParamValue, setParamValue } from '@/services/params'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'

test.each([
  ['23', [23]],
  ['true,23,foo', [true, 23, 'foo']],
  ['1,2,3,4,5', [1, 2, 3, 4, 5]],
])('given an array of params with valid values, returns an array of values', (input, expected) => {
  const array = arrayOf([Number, Boolean, String])

  const result = getParamValue(input, { param: array })

  expect(result).toEqual(expected)
})

test('given an array of params with an invalid value, throws InvalidRouteParamValueError', () => {
  const array = arrayOf([Number, Boolean])

  const action: () => void = () => getParamValue('true, 23, foo', { param: array })

  expect(action).toThrow(InvalidRouteParamValueError)
})

test('given value is not an array, throws InvalidRouteParamValueError', () => {
  const array = arrayOf([Number, Boolean])

  const action: () => void = () => setParamValue({}, { param: array })

  expect(action).toThrow('Expected an array')
})

test('given a separator, uses it to split the value', () => {
  const array = arrayOf([Number, Boolean, String], { separator: '|' })

  const result = getParamValue('1|2|3', { param: array })

  expect(result).toEqual([1, 2, 3])
})
