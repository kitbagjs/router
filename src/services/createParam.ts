import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'
import { CreatedParam, PARAM_ID_SYMBOL, ParamIdentity } from '@/types/createdParam'
import { getParamId } from '@/services/getParamId'

export function createParam<TParamOptions extends ParamWithDefault>(param: TParamOptions): TParamOptions & ParamIdentity
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions): CreatedParam<ExtractParamType<TParamOptions>>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue: NoInfer<ExtractParamType<TParamOptions>>): ParamWithDefault<TParamOptions> & ParamIdentity
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue?: ExtractParamType<TParamOptions>): ParamGetSetOptions<ExtractParamType<TParamOptions>> & ParamIdentity {
  const id = getParamId(param)

  if (isParamGetSetOptions(param)) {
    return { ...param, [PARAM_ID_SYMBOL]: id, defaultValue: defaultValue ?? param.defaultValue }
  }

  return {
    [PARAM_ID_SYMBOL]: id,
    get: (value) => getParamValue(value, { param }),
    set: (value) => setParamValue(value, { param }),
    defaultValue,
  }
}
