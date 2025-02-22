/* eslint-disable @typescript-eslint/only-throw-error */
import { Param, ParamGetSet } from '@/types/paramTypes'
import { ExtractParamType } from '@/types/params'
import { unionOf } from './unionOf'

type ArrayOfOptions = {
  separator?: string,
}

const defaultOptions = {
  separator: ',',
} satisfies ArrayOfOptions

export function arrayOf<const T extends Param[]>(params: T, options: ArrayOfOptions = {}): ParamGetSet<ExtractParamType<T[number]>[]> {
  const { separator } = { ...defaultOptions, ...options }
  const union = unionOf(params)

  return {
    get: (value, extras) => {
      return value.split(separator).map((value) => union.get(value, extras))
    },
    set: (value, extras) => {
      if (!Array.isArray(value)) {
        throw extras.invalid('Expected an array')
      }

      return value.map((value) => union.set(value, extras)).join(separator)
    },
  }
}
