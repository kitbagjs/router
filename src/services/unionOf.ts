import { Param, ParamGetSet } from '@/types/paramTypes'
import { safeGetParamValue, safeSetParamValue } from '@/services/params'
import { ExtractParamType } from '@/types/params'

export function unionOf<const T extends Param[]>(params: T): ParamGetSet<ExtractParamType<T[number]>>
export function unionOf(params: Param[]): ParamGetSet {
  return {
    get: (value, { invalid }) => {
      for (const param of params) {
        const result = safeGetParamValue(value, param)

        if (result !== undefined) {
          return result
        }
      }

      throw invalid(`Value "${value}" does not satisfy any of the possible values`)
    },
    set: (value, { invalid }) => {
      for (const param of params) {
        const result = safeSetParamValue(value, param)

        if (result !== undefined) {
          return result
        }
      }

      throw invalid(`Value "${value}" does not satisfy any of the possible values`)
    },
  }
}
