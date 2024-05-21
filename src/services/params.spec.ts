import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { getParamValue, optional, setParamValue } from '@/services/params'
import { ParamGetSet, ParamGetter } from '@/types/paramTypes'

describe('getParamValue', () => {
  test('given Boolean constructor Param, returns for correct value for Boolean', () => {
    expect(getParamValue('true', Boolean)).toBe(true)
    expect(getParamValue('false', Boolean)).toBe(false)
    expect(() => getParamValue('foo', Boolean)).toThrow(InvalidRouteParamValueError)
  })

  test('given  Number constructor Param, returns for correct value for Number', () => {
    expect(getParamValue('1', Number)).toBe(1)
    expect(getParamValue('1.5', Number)).toBe(1.5)
    expect(() => getParamValue('foo', Number)).toThrow(InvalidRouteParamValueError)
  })

  test('Given a JSON Param, returns correct value for JSON', () => {
    expect(getParamValue('1', JSON)).toBe(1)
    expect(getParamValue('"foo"', JSON)).toBe('foo')
    expect(() => getParamValue('foo', JSON)).toThrow(InvalidRouteParamValueError)
  })

  test('given  Date constructor Param, returns for correct value for Date', () => {
    expect(getParamValue('2024-05-16T21:13:56.842Z', Date)).toMatchObject(new Date('2024-05-16T21:13:56.842Z'))
    expect(() => getParamValue('foo', Date)).toThrow(InvalidRouteParamValueError)
  })

  test('Given Regex Param, returns for correct value for RegExp', () => {
    const param = /yes/

    expect(getParamValue('yes', param)).toBe('yes')
    expect(() => getParamValue('no', param)).toThrow(InvalidRouteParamValueError)
    expect(() => getParamValue('foo', param)).toThrow(InvalidRouteParamValueError)
  })

  test.each([
    [undefined],
    [''],
  ])('Given Optional Param and string without value, returns undefined', (stringWithoutValue) => {
    const paramTypes = [String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter']

    for (const param of paramTypes) {
      expect(getParamValue(stringWithoutValue, optional(param))).toBe(undefined)
    }
  })

  test('Given Custom Getter Param, returns for correct value for ParamGetter', () => {
    const param: ParamGetter<'yes'> = (value, { invalid }) => {
      if (value !== 'yes') {
        invalid()
      }

      return 'yes'
    }

    expect(getParamValue('yes', param)).toBe('yes')
    expect(() => getParamValue('no', param)).toThrowError()
    expect(() => getParamValue('foo', param)).toThrowError()
  })

  test('Given Custom GetSet, returns correct value for ParamGetSet', () => {
    const getter: ParamGetSet<'yes'> = {
      get: (value, { invalid }) => {
        if (value !== 'yes') {
          invalid()
        }

        return 'yes'
      },
      set: value => value,
    }

    expect(getParamValue('yes', getter)).toBe('yes')
    expect(() => getParamValue('no', getter)).toThrowError()
    expect(() => getParamValue('foo', getter)).toThrowError()
  })

})

describe('setParamValue', () => {
  test('Given Boolean Param, returns for correct value for Boolean', () => {
    expect(setParamValue(true, Boolean)).toBe('true')
    expect(setParamValue(false, Boolean)).toBe('false')
    expect(() => setParamValue('foo', Boolean)).toThrow(InvalidRouteParamValueError)
  })

  test('Given Number Param, returns for correct value for Number', () => {
    expect(setParamValue(1, Number)).toBe('1')
    expect(setParamValue(1.5, Number)).toBe('1.5')
    expect(() => setParamValue('foo', Number)).toThrow(InvalidRouteParamValueError)
  })

  test('given  Date constructor Param, returns for correct value for Date', () => {
    expect(setParamValue(new Date('2024-05-16T21:13:56.842Z'), Date)).toBe('2024-05-16T21:13:56.842Z')
    expect(() => setParamValue('foo', Date)).toThrow(InvalidRouteParamValueError)
  })

  test('Given a JSON Param, returns correct value for JSON', () => {
    expect(setParamValue(['foo'], JSON)).toBe('["foo"]')
    expect(setParamValue(1.5, JSON)).toBe('1.5')

    const circular: Record<string, any> = { foo: 'bar' }
    circular.foo = circular

    expect(() => setParamValue(circular, JSON)).toThrow(InvalidRouteParamValueError)
  })

  test('Given Regex Param, returns value as String', () => {
    const param = /yes/

    expect(setParamValue('yes', param)).toBe('yes')
  })

  test('Given Optional Param and value undefined, assigns empty string', () => {
    const paramTypes = [String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter']

    for (const param of paramTypes) {
      expect(setParamValue(undefined, optional(param))).toBe('')
    }
  })

  test('Given Getter Custom Param, returns value as String', () => {
    const param: ParamGetter = (value, { invalid }) => {
      if (value !== 'yes') {
        invalid()
      }

      return 'yes'
    }

    expect(setParamValue('yes', param)).toBe('yes')
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

    expect(setParamValue('yes', param)).toBe('yes')
    expect(() => setParamValue('no', param)).toThrowError()
    expect(() => setParamValue('foo', param)).toThrowError()
  })
})