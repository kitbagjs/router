import { createParam } from '@/services/createParam'
import { ExtractParamType } from '@/types/params'
import { Param, ParamGetSet } from '@/types/paramTypes'

const optionalParamKey = Symbol()

export type IsOptionalParam = {
  [optionalParamKey]: true,
}

export type OptionalParamGetSet<TParam extends Param> = TParam extends ParamGetSet
  ? TParam & IsOptionalParam
  : ParamGetSet<ExtractParamType<TParam>> & IsOptionalParam

export function isOptionalParam(param: Param | OptionalParamGetSet<Param>): param is OptionalParamGetSet<Param> {
  return optionalParamKey in param
}

export function optional<TParam extends Param>(param: TParam): OptionalParamGetSet<TParam> {
  return {
    [optionalParamKey]: true,
    ...createParam(param),
  } as OptionalParamGetSet<TParam>
}