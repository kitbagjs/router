import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSet } from '@/types/params'
import { Param, ParamGetSet } from '@/types/paramTypes'

export function createParam<TParam extends Param>(param: TParam): ParamGetSet<ExtractParamType<TParam>>
export function createParam<TParam extends Param>(param: TParam, defaultValue: ExtractParamType<TParam>): ParamWithDefault<TParam>
export function createParam<TParam extends Param>(param: TParam, defaultValue?: ExtractParamType<TParam>): ParamGetSet<ExtractParamType<TParam>> {
  if (isParamGetSet(param)) {
    return param
  }

  return {
    get: (value) => getParamValue(value, param),
    set: (value) => setParamValue(value, param),
    defaultValue,
  }
}