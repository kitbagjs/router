import { expect, test, vi } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { unionOf } from '@/services/unionOf'
import { getParamValue } from './params'

function throwsInvalidRouteParamValueError(): () => never {
  return () => {
    throw new InvalidRouteParamValueError()
  }
}

test('given several params, calls each until one returns a value', () => {
  const aParam = vi.fn().mockImplementationOnce(throwsInvalidRouteParamValueError())
  const bParam = vi.fn().mockImplementationOnce(throwsInvalidRouteParamValueError())
  const cParam = vi.fn().mockImplementationOnce(() => 'works!')
  const dParam = vi.fn().mockImplementationOnce(() => 'also works!')

  const union = unionOf([aParam, bParam, cParam, dParam])

  const result = getParamValue('foo', union)

  expect(aParam).toHaveBeenCalledTimes(1)
  expect(bParam).toHaveBeenCalledTimes(1)
  expect(cParam).toHaveBeenCalledTimes(1)
  expect(dParam).not.toHaveBeenCalled()

  expect(result).toBe('works!')
})

test('given no param returns value, throws InvalidRouteParamValueError', () => {
  const aParam = vi.fn().mockImplementationOnce(throwsInvalidRouteParamValueError())
  const bParam = vi.fn().mockImplementationOnce(throwsInvalidRouteParamValueError())
  const cParam = vi.fn().mockImplementationOnce(throwsInvalidRouteParamValueError())
  const dParam = vi.fn().mockImplementationOnce(throwsInvalidRouteParamValueError())

  const union = unionOf([aParam, bParam, cParam, dParam])

  const action: () => void = () => getParamValue('foo', union)

  expect(action).toThrow('Value foo does not satisfy any of the possible values')
  expect(aParam).toHaveBeenCalledTimes(1)
  expect(bParam).toHaveBeenCalledTimes(1)
  expect(cParam).toHaveBeenCalledTimes(1)
  expect(dParam).toHaveBeenCalledTimes(1)
})

test('given a param that throws something other than InvalidRouteParamValueError, throws the error', () => {
  const param = vi.fn().mockImplementationOnce(() => {
    throw new Error('Something went wrong')
  })

  const union = unionOf([param])

  const action: () => void = () => getParamValue('foo', union)

  expect(action).toThrow('Something went wrong')
})

test.each([
  [Number, '1', 1],
  [Boolean, 'true', true],
  [JSON, '{"foo": "bar"}', { foo: 'bar' }],
  [Date, '2021-01-01T00:00:00.000Z', new Date('2021-01-01T00:00:00.000Z')],
  [/foo/, 'foo', 'foo'],
  [String, 'foo', 'foo'],
])('works with param of built-in type %s', (param, input, output) => {
  const union = unionOf([param])

  const result = getParamValue(input, union)

  if (typeof output === 'object') {
    expect(result).toEqual(output)
  } else {
    expect(result).toBe(output)
  }
})

test.each([
  23, 'foo', true,
])('works with literal param of type %s', (value) => {
  const union = unionOf([value])

  const result = getParamValue(value.toString(), union)

  expect(result).toBe(value)
})
