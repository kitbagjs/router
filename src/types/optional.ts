import { ExtractParamType, Param, ParamGetSet } from '@/types'
import { getParamValue, setParamValue } from '@/utilities'

export function optional<TParam extends Param>(param: TParam): ParamGetSet<ExtractParamType<TParam> | undefined> {
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