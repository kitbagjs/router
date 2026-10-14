import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'

export function createParam<TParam extends ParamWithDefault>(param: TParam): TParam
export function createParam<TParam extends ParamOptions>(param: TParam): ParamGetSetOptions<ExtractParamType<TParam>>
export function createParam<TParam extends ParamOptions>(param: TParam, defaultValue: NoInfer<ExtractParamType<TParam>>): ParamWithDefault<TParam>
export function createParam<TParam extends ParamOptions>(param: TParam, defaultValue?: ExtractParamType<TParam>): ParamGetSetOptions<ExtractParamType<TParam>> {
  if (isParamGetSetOptions(param)) {
    return { ...param, defaultValue: defaultValue ?? param.defaultValue }
  }

  return {
    get: (value) => getParamValue(value, { param }),
    set: (value) => setParamValue(value, { param }),
    defaultValue,
  }
}
