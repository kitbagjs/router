import { getParamValue, setParamValue } from '@/services/params'
import { ParamWithDefault } from '@/services/withDefault'
import { ExtractParamType, isParamGetSetOptions } from '@/types/params'
import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'
import { CreatedParam, isCreatedParam, PARAM_ID_SYMBOL, ParamIdentity } from '@/types/createdParam'

export function createParam<TParamOptions extends ParamWithDefault>(param: TParamOptions): TParamOptions & ParamIdentity
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions): CreatedParam<ExtractParamType<TParamOptions>>
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue: NoInfer<ExtractParamType<TParamOptions>>): ParamWithDefault<TParamOptions> & ParamIdentity
export function createParam<TParamOptions extends ParamOptions>(param: TParamOptions, defaultValue?: ExtractParamType<TParamOptions>): ParamGetSetOptions<ExtractParamType<TParamOptions>> & ParamIdentity {
  const id = isCreatedParam(param) ? param[PARAM_ID_SYMBOL] : Symbol()

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
