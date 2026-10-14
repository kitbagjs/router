import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions } from '@/types/paramTypes'
import { Param, PARAM_ID_SYMBOL, ParamIdentity } from '@/types/param'
import { getParamId } from '@/services/getParamId'

export function createParam<TParamOptions extends ParamWithDefault>(param: TParamOptions): TParamOptions & ParamIdentity
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions): Param<ExtractParamType<TParamOptions>>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue: NoInfer<ExtractParamType<TParamOptions>>): ParamWithDefault<TParamOptions> & ParamIdentity
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue?: ExtractParamType<TParamOptions>): Param<ExtractParamType<TParamOptions>> {
  const id = getParamId(param)

  if (isParamGetSetOptions(param)) {
    return {
      ...param,
      [PARAM_ID_SYMBOL]: id,
      defaultValue: defaultValue ?? param.defaultValue,
    }
  }

  return {
    [PARAM_ID_SYMBOL]: id,
    get: (value) => getParamValue(value, { param }),
    set: (value) => setParamValue(value, { param }),
    defaultValue,
  }
}
