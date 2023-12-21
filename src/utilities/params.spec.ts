import { describe, expect, test } from 'vitest'
import { ParamGetSet, ParamGetter } from '@/types'
import { getParamValue, setParamValue } from '@/utilities/params'

describe('getParamValue', () => {

  test('returns for correct value for Boolean', () => {
    expect(getParamValue('true', Boolean)).toBe(true)
    expect(getParamValue('false', Boolean)).toBe(false)
    expect(() => getParamValue('foo', Boolean)).toThrowError()
  })

  test('returns for correct value for Number', () => {
    expect(getParamValue('1', Number)).toBe(1)
    expect(getParamValue('1.5', Number)).toBe(1.5)
    expect(() => getParamValue('foo', Number)).toThrowError()
  })

  test('returns for correct value for RegExp', () => {
    const param = /yes/

    expect(getParamValue('yes', param)).toBe('yes')
    expect(() => getParamValue('no', param)).toThrowError()
    expect(() => getParamValue('foo', param)).toThrowError()
  })

  test('returns for correct value for ParamGetter', () => {
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

  test('returns correct value for ParamGetSet', () => {
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
  test('returns for correct value for Boolean', () => {
    expect(setParamValue(true, Boolean)).toBe('true')
    expect(setParamValue(false, Boolean)).toBe('false')
    expect(() => setParamValue('foo', Boolean)).toThrowError()
  })

  test('returns for correct value for Number', () => {
    expect(setParamValue(1, Number)).toBe('1')
    expect(setParamValue(1.5, Number)).toBe('1.5')
    expect(() => setParamValue('foo', Number)).toThrowError()
  })

  test('returns for correct value for RegExp', () => {
    const param = /yes/

    expect(setParamValue('yes', param)).toBe('yes')
    expect(() => setParamValue('no', param)).toThrowError()
    expect(() => setParamValue('foo', param)).toThrowError()
  })

  test('returns for correct value for ParamGetter', () => {
    const param: ParamGetter = (value, { invalid }) => {
      if (value !== 'yes') {
        invalid()
      }

      return 'yes'
    }

    expect(setParamValue('yes', param)).toBe('yes')
    expect(() => setParamValue('no', param)).toThrowError()
    expect(() => setParamValue('foo', param)).toThrowError()
  })

  test('returns correct value for ParamGetSet', () => {
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