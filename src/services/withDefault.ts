import { asParamGetSet } from '@/services/asParamGetSet'
import { ExtractParamType, isParamGetSet } from '@/types/params'
import { Param, ParamGetSet } from '@/types/paramTypes'

export type ParamWithDefault<TParam extends Param, TParamType extends ExtractParamType<TParam> = ExtractParamType<TParam>> = Required<ParamGetSet<TParamType>>

export function isWithDefaultParam(param: Param): param is ParamWithDefault<Param> {
  return isParamGetSet(param) && param.defaultValue !== undefined
}

export function withDefault<TParam extends Param, TParamType extends ExtractParamType<TParam> = ExtractParamType<TParam>>(param: TParam, defaultValue: TParamType): ParamWithDefault<TParam, TParamType> {
  return {
    defaultValue,
    ...asParamGetSet(param),
  }
}