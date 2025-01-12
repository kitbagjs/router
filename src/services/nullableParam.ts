import { Param, ParamGetSet } from '@/types/paramTypes'
import { createParam } from './createParam'
import { getParamValue, setParamValue } from './params'
import { ExtractParamType } from '@/types/params'

export const nullKey = 'NULL\u0000'

export function nullable<TParam extends Param>(param: TParam): ParamGetSet<ExtractParamType<TParam> | null>
export function nullable(param: Param): ParamGetSet {
  return createParam({
    get: (value) => {
      if (value === nullKey) {
        return null
      }

      return getParamValue(value, param, true)
    },
    set: (value: number | null) => {
      if (value === null) {
        return ''
      }

      return setParamValue(value, param, true)
    },
    defaultValue: nullKey,
  })
}
