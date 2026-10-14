import { createParam } from '@/services/createParam'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'

export type ParamWithDefault<TParam extends ParamOptions = ParamOptions> = Required<ParamGetSetOptions<ExtractParamType<TParam>>>

export function isParamWithDefault(param: ParamOptions): param is ParamWithDefault {
  return isParamGetSetOptions(param) && param.defaultValue !== undefined
}

export function withDefault<TParam extends ParamOptions>(param: TParam, defaultValue: ExtractParamType<TParam>): ParamWithDefault<TParam> {
  return createParam(param, defaultValue)
}
