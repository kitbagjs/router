import { createParam } from '@/services/createParam'
import { ExtractParamType, isParamGetSet } from '@/types/params'
import { Param, ParamGetSet } from '@/types/paramTypes'

export type ParamWithDefault<TParam extends Param = Param> = Required<ParamGetSet<ExtractParamType<TParam>>>

export function isParamWithDefault(param: Param): param is ParamWithDefault {
  return isParamGetSet(param) && param.defaultValue !== undefined
}

export function withDefault<TParam extends Param>(param: TParam, defaultValue: ExtractParamType<TParam>): ParamWithDefault<TParam> {
  return createParam(param, defaultValue)
}
