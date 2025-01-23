/* eslint-disable @typescript-eslint/only-throw-error */
import { Param, ParamGetSet } from '@/types/paramTypes'
import { ExtractParamType } from '@/types/params'
import { unionOf } from './unionOf'

export function arrayOf<const T extends Param[]>(...params: T): ParamGetSet<ExtractParamType<T[number]>[]> {
  const union = unionOf(...params)

  return {
    get: (value, extras) => {
      return value.split(',').map((value) => union.get(value, extras))
    },
    set: (value, extras) => {
      if (!Array.isArray(value)) {
        throw extras.invalid('Expected an array')
      }

      return value.map((value) => union.set(value, extras)).join(',')
    },
  }
}
