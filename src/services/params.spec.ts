import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { getParamValue, setParamValue } from '@/services/params'
import { withDefault } from '@/services/withDefault'
import { ParamGetSet, ParamGetter } from '@/types/paramTypes'

describe('getParamValue', () => {
  test('given Boolean constructor Param, returns for correct value for Boolean', () => {
    expect(getParamValue('true', { param: Boolean })).toBe(true)
    expect(getParamValue('false', { param: Boolean })).toBe(false)
    expect(() => getParamValue('foo', { param: Boolean })).toThrow(InvalidRouteParamValueError)
  })

  test('given  Number constructor Param, returns for correct value for Number', () => {
    expect(getParamValue('1', { param: Number })).toBe(1)
    expect(getParamValue('1.5', { param: Number })).toBe(1.5)
    expect(() => getParamValue('foo', { param: Number })).toThrow(InvalidRouteParamValueError)
  })

  test('Given a JSON Param, returns correct value for JSON', () => {
    expect(getParamValue('1', { param: JSON })).toBe(1)
    expect(getParamValue('"foo"', { param: JSON })).toBe('foo')
    expect(() => getParamValue('foo', { param: JSON })).toThrow(InvalidRouteParamValueError)
  })

  test('given  Date constructor Param, returns for correct value for Date', () => {
    expect(getParamValue('2024-05-16T21:13:56.842Z', { param: Date })).toMatchObject(new Date('2024-05-16T21:13:56.842Z'))
    expect(() => getParamValue('foo', { param: Date })).toThrow(InvalidRouteParamValueError)
  })

  test('Given Regex Param, returns for correct value for RegExp', () => {
    const param = /yes/

    expect(getParamValue('yes', { param })).toBe('yes')
    expect(() => getParamValue('no', { param })).toThrow(InvalidRouteParamValueError)
    expect(() => getParamValue('foo', { param })).toThrow(InvalidRouteParamValueError)
  })

  test('given  Literal Param, with matching value, returns value', () => {
    expect(getParamValue('foo', { param: 'foo' })).toBe('foo')
    expect(getParamValue('1', { param: 1 })).toBe(1)
    expect(getParamValue('true', { param: true })).toBe(true)
  })

  test('given Literal Param, with non-matching value, throws InvalidRouteParamValueError', () => {
    expect(() => getParamValue('foo', { param: 'bar' })).toThrow(InvalidRouteParamValueError)
    expect(() => getParamValue('1', { param: 2 })).toThrow(InvalidRouteParamValueError)
    expect(() => getParamValue('true', { param: false })).toThrow(InvalidRouteParamValueError)
  })

  test.each([
    [undefined],
    [''],
  ])('Given Optional Param and string without value, returns undefined', (stringWithoutValue) => {
    const paramTypes = [String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter']

    for (const param of paramTypes) {
      expect(getParamValue(stringWithoutValue, { param, isOptional: true })).toBe(undefined)
    }
  })

  test.each([
    [undefined],
    [''],
  ])('Given Optional Param with default and string without value, returns default value', (stringWithoutValue) => {
    const paramTypes = [String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter']

    for (const param of paramTypes) {
      expect(getParamValue(stringWithoutValue, { param: withDefault(param, 'abc'), isOptional: true })).toBe('abc')
    }
  })

  test('Given Custom Getter Param, returns for correct value for ParamGetter', () => {
    const param: ParamGetter<'yes'> = (value, { invalid }) => {
      if (value !== 'yes') {
        invalid()
      }

      return 'yes'
    }

    expect(getParamValue('yes', { param })).toBe('yes')
    expect(() => getParamValue('no', { param })).toThrowError()
    expect(() => getParamValue('foo', { param })).toThrowError()
  })

  test('Given Custom GetSet, returns correct value for ParamGetSet', () => {
    const getter: ParamGetSet<'yes'> = {
      get: (value, { invalid }) => {
        if (value !== 'yes') {
          invalid()
        }

        return 'yes'
      },
      set: (value) => value,
    }

    expect(getParamValue('yes', { param: getter })).toBe('yes')
    expect(() => getParamValue('no', { param: getter })).toThrowError()
    expect(() => getParamValue('foo', { param: getter })).toThrowError()
  })
})

describe('setParamValue', () => {
  test('Given Boolean Param, returns for correct value for Boolean', () => {
    expect(setParamValue(true, { param: Boolean })).toBe('true')
    expect(setParamValue(false, { param: Boolean })).toBe('false')
    expect(() => setParamValue('foo', { param: Boolean })).toThrow(InvalidRouteParamValueError)
  })

  test('Given Number Param, returns for correct value for Number', () => {
    expect(setParamValue(1, { param: Number })).toBe('1')
    expect(setParamValue(1.5, { param: Number })).toBe('1.5')
    expect(() => setParamValue('foo', { param: Number })).toThrow(InvalidRouteParamValueError)
  })

  test('given  Date constructor Param, returns for correct value for Date', () => {
    expect(setParamValue(new Date('2024-05-16T21:13:56.842Z'), { param: Date })).toBe('2024-05-16T21:13:56.842Z')
    expect(() => setParamValue('foo', { param: Date })).toThrow(InvalidRouteParamValueError)
  })

  test('Given a JSON Param, returns correct value for JSON', () => {
    expect(setParamValue(['foo'], { param: JSON })).toBe('["foo"]')
    expect(setParamValue(1.5, { param: JSON })).toBe('1.5')

    const circular: Record<string, any> = { foo: 'bar' }
    circular.foo = circular

    expect(() => setParamValue(circular, { param: JSON })).toThrow(InvalidRouteParamValueError)
  })

  test('Given Regex Param, returns value as String', () => {
    const param = /yes/

    expect(setParamValue('yes', { param })).toBe('yes')
  })

  test('Given Literal Param, with matching value, returns value', () => {
    expect(setParamValue('foo', { param: 'foo' })).toBe('foo')
    expect(setParamValue(1, { param: 1 })).toBe('1')
    expect(setParamValue(true, { param: true })).toBe('true')
  })

  test('Given Literal Param, with non-matching value, throws InvalidRouteParamValueError', () => {
    expect(() => setParamValue('foo', { param: 'bar' })).toThrow(InvalidRouteParamValueError)
    expect(() => setParamValue(1, { param: 2 })).toThrow(InvalidRouteParamValueError)
    expect(() => setParamValue(true, { param: false })).toThrow(InvalidRouteParamValueError)
  })

  test('Given Optional Param and value undefined, assigns empty string', () => {
    const paramTypes = [String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter']

    for (const param of paramTypes) {
      expect(setParamValue(undefined, { param, isOptional: true })).toBe('')
      expect(setParamValue(undefined, { param: withDefault(param, 'abc'), isOptional: true })).toBe('')
    }
  })

  test('Given Getter Custom Param, returns value as String', () => {
    const param: ParamGetter = (value, { invalid }) => {
      if (value !== 'yes') {
        invalid()
      }

      return 'yes'
    }

    expect(setParamValue('yes', { param })).toBe('yes')
  })

  test('Given Custom GetSet Param, returns correct value for ParamGetSet', () => {
    const param: ParamGetSet = {
      get: (value, { invalid }) => {
        if (value !== 'yes') {
          invalid()
        }

        return 'yes'
      },
      set: (value, { invalid }) => {
        if (value !== 'yes') {
          invalid()
        }

        return 'yes'
      },
    }

    expect(setParamValue('yes', { param })).toBe('yes')
    expect(() => setParamValue('no', { param })).toThrowError()
    expect(() => setParamValue('foo', { param })).toThrowError()
  })
})
