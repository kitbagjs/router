import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'

export function createParam<TParamOptions extends ParamWithDefault>(param: TParamOptions): TParamOptions
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions): ParamGetSetOptions<ExtractParamType<TParamOptions>>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue: NoInfer<ExtractParamType<TParamOptions>>): ParamWithDefault<TParamOptions>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue?: ExtractParamType<TParamOptions>): ParamGetSetOptions<ExtractParamType<TParamOptions>> {
  if (isParamGetSetOptions(param)) {
    return { ...param, defaultValue: defaultValue ?? param.defaultValue }
  }

  return {
    get: (value) => getParamValue(value, { param }),
    set: (value) => setParamValue(value, { param }),
    defaultValue,
  }
}
