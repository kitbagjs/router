import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'
import { safeGetParamValue, safeSetParamValue } from '@/services/params'
import { ExtractParamType } from '@/types/params'

export function unionOf<const T extends ParamOptions[]>(params: T): ParamGetSetOptions<ExtractParamType<T[number]>>
export function unionOf(params: ParamOptions[]): ParamGetSetOptions {
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
