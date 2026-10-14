import { Param, ParamGetSetOptions } from '@/types/paramTypes'
import { isParamGetSetOptions } from '@/types/params'

export const PARAM_ID_SYMBOL = Symbol('PARAM_ID_SYMBOL')

export type ParamIdentity = {
  [PARAM_ID_SYMBOL]: symbol,
}

/**
 * A param definition with an identity that can be looked up independently of its URL name.
 */
export type CreatedParam<T = unknown> = ParamGetSetOptions<T> & ParamIdentity

export function isCreatedParam(param: Param): param is CreatedParam {
  return isParamGetSetOptions(param) && PARAM_ID_SYMBOL in param
}
