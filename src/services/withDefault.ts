import { Param } from '@/types/param'
import { createParam } from '@/services/createParam'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions } from '@/types/paramTypes'

export type ParamWithDefault<TParamOptions extends ParamOptions = ParamOptions> = Required<Param<ExtractParamType<TParamOptions>>>

export function isParamWithDefault(param: ParamOptions): param is ParamWithDefault {
  return isParamGetSetOptions(param) && param.defaultValue !== undefined
}

export function withDefault<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue: ExtractParamType<TParamOptions>): ParamWithDefault<TParamOptions> {
  return createParam(param, defaultValue)
}
