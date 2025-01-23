import { expect, test } from 'vitest'
import { tupleOf } from '@/services/tupleOf'
import { getParamValue, setParamValue } from '@/services/params'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'

test.each([
  ['23,true,foo', [23, true, 'foo']],
  ['-2,false,bar', [-2, false, 'bar']],
])('given an array of params with valid values, returns an array of values', (input, expected) => {
  const array = tupleOf(Number, Boolean, String)

  const result = getParamValue(input, array)

  expect(result).toEqual(expected)
})

test.each([
  {}, true, '', Infinity,
])('given value is %s not an array, throws InvalidRouteParamValueError', (value) => {
  const array = tupleOf(Number, Boolean)

  const action: () => void = () => setParamValue(value, array)

  expect(action).toThrow('Expected an array')
})

test('given value with too few values, throws InvalidRouteParamValueError', () => {
  const array = tupleOf(Number, Number)

  const action: () => void = () => setParamValue([1], array)

  expect(action).toThrow('Expected tuple with 2 values')
})

test('given value with too many values, throws InvalidRouteParamValueError', () => {
  const array = tupleOf(Number, Number)

  const action: () => void = () => setParamValue([1, 2, 3], array)

  expect(action).toThrow('Expected tuple with 2 values')
})

test.each([
  ['23'],
  ['true,23'],
])('given an array of params with invalid value %s, throws InvalidRouteParamValueError', (value) => {
  const array = tupleOf(Number, Boolean)

  const action: () => void = () => getParamValue(value, array)

  expect(action).toThrow(InvalidRouteParamValueError)
})
