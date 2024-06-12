import { getParamValue, setParamValue } from '@/services/params'
import { ExtractParamType, isParamGetSet } from '@/types/params'
import { Param, ParamGetSet } from '@/types/paramTypes'

export function asParamGetSet<TParam extends Param, TParamType extends ExtractParamType<TParam>>(param: TParam): ParamGetSet<TParamType> {
  if (isParamGetSet(param)) {
    return param
  }

  return {
    get: (value) => getParamValue(value, param),
    set: (value) => setParamValue(value, param),
  }
}
