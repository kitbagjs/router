import { Param } from '@/types/param'
import { ParamOptions } from '@/types/paramTypes'
import { safeGetParamValue, safeSetParamValue } from '@/services/params'
import { ExtractParamType } from '@/types/params'

export function unionOf<const TParamOptions extends ParamOptions[]>(params: TParamOptions): Param<ExtractParamType<TParamOptions[number]>>
export function unionOf(params: ParamOptions[]): Param {
  return {
    get: (value, { invalid }) => {
      for (const param of params) {
        const result = safeGetParamValue(value, { param, isOptional: false, isGreedy: false })

        if (result !== undefined) {
          return result
        }
      }

      throw invalid(`Value "${value}" does not satisfy any of the possible values`)
    },
    set: (value, { invalid }) => {
      for (const param of params) {
        const result = safeSetParamValue(value, { param, isOptional: false, isGreedy: false })

        if (result !== undefined) {
          return result
        }
      }

      throw invalid(`Value "${value}" does not satisfy any of the possible values`)
    },
  }
}
