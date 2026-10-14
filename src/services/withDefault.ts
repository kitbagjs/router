import { createParam } from '@/services/createParam'
import { ExtractParamType, isParamGetSet } from '@/types/params'
import { ParamOptions, ParamGetSet } from '@/types/paramTypes'

export type ParamWithDefault<TParam extends ParamOptions = ParamOptions> = Required<ParamGetSet<ExtractParamType<TParam>>>

export function isParamWithDefault(param: ParamOptions): param is ParamWithDefault {
  return isParamGetSet(param) && param.defaultValue !== undefined
}

export function withDefault<TParam extends ParamOptions>(param: TParam, defaultValue: ExtractParamType<TParam>): ParamWithDefault<TParam> {
  return createParam(param, defaultValue)
}
