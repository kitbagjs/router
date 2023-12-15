import { ExtractParamType, Param, ParamGetSet } from '@/types'
import { getParamValue, setParamValue } from '@/utilities'

export function optional<TParam extends Param, TValue extends ExtractParamType<TParam>>(param: TParam): ParamGetSet<TValue | undefined> {
  return {
    get: (value) => {
      if (value === '') {
        return undefined
      }

      return getParamValue(value, param)
    },
    set: (value) => {
      if (value === undefined) {
        return ''
      }

      return setParamValue(value, param)
    },
  }
}