import { Param, IS_PARAM_SYMBOL, ParamInternal } from '@/types/param'
import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions } from '@/types/paramTypes'

export function createParam<TParamOptions extends ParamWithDefault>(param: TParamOptions): TParamOptions
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions): Param<ExtractParamType<TParamOptions>>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue: NoInfer<ExtractParamType<TParamOptions>>): ParamWithDefault<TParamOptions>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue?: ExtractParamType<TParamOptions>): Param<ExtractParamType<TParamOptions>> {
  const internal = {
    [IS_PARAM_SYMBOL]: true,
  } satisfies ParamInternal

  if (isParamGetSetOptions(param)) {
    return { ...param, ...internal, defaultValue: defaultValue ?? param.defaultValue }
  }

  return {
    ...internal,
    get: (value) => getParamValue(value, { param }),
    set: (value) => setParamValue(value, { param }),
    defaultValue,
  }
}
